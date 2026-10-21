// Server-side domain logic for the demo backend: serializers, cart quoting, inventory
// mutations with an audit trail. Mirrors the rules a production API must enforce.
import { newId } from './db.js';
import { HttpError } from './http.js';
import { evaluateCoupon, computeTotals } from '../../lib/pricing.js';
import { isVariantPurchasable, productStockStatus, variantStockStatus } from '../../lib/inventory.js';
import { priceRange, productBadges, ratingSummary } from '../../lib/product.js';

// ───────────────────────────── products
export function serializeProduct(db, p, { admin = false } = {}) {
  const brand = db.brands.find((b) => b.id === p.brandId);
  const category = db.categories.find((c) => c.id === p.categoryId);
  const subcategory = category?.subcategories.find((s) => s.id === p.subcategoryId);
  const rating = ratingSummary(db.reviews.filter((r) => r.productId === p.id));
  const variants = p.variants.map((v) => {
    const out = { ...v, stockStatus: variantStockStatus(v, p.lowStockThreshold) };
    delete out.art;
    if (!admin) delete out.costPrice;
    return out;
  });
  const range = priceRange(p.variants);
  const onSale = p.variants.some((v) => !v.discontinued && v.compareAtPrice && v.compareAtPrice > v.price);
  const stockStatus = productStockStatus(p);
  const out = {
    ...p,
    variants,
    brand: brand ? { id: brand.id, name: brand.name, slug: brand.slug } : null,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    subcategory: subcategory ? { ...subcategory } : null,
    priceMin: range.min,
    priceMax: range.max,
    onSale,
    stockStatus,
    rating,
  };
  out.badges = productBadges(out);
  delete out.art;
  if (!admin) delete out.salesCount;
  return out;
}

export const publishedProducts = (db) => db.products.filter((p) => p.status === 'published');

export function findVariant(db, productId, variantId) {
  const product = db.products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.id === variantId);
  return { product, variant };
}

// ───────────────────────────── cart quoting
/**
 * Re-prices a cart from the database. Never trusts client prices.
 * Lines are reported with a status so the client can explain every change:
 *  ok | adjusted (qty reduced to available) | unavailable (sold out / discontinued / unpublished)
 */
export function quoteCart(db, { items = [], couponCode, governorate, customerKey }) {
  const lines = [];
  for (const raw of items) {
    const quantity = Math.max(1, Math.floor(Number(raw.quantity) || 1));
    const { product, variant } = findVariant(db, raw.productId, raw.variantId);
    if (!product || !variant || product.status !== 'published') {
      lines.push({ productId: raw.productId, variantId: raw.variantId, quantity, status: 'unavailable', reason: 'removed', name: product?.name ?? 'Item no longer available', available: 0, unitPrice: 0, lineTotal: 0 });
      continue;
    }
    const available = variant.discontinued ? 0 : Math.max(0, variant.stock);
    let status = 'ok';
    let reason = null;
    if (!isVariantPurchasable(variant)) {
      status = 'unavailable';
      reason = variant.discontinued ? 'discontinued' : 'sold_out';
    } else if (quantity > available) {
      status = 'adjusted';
      reason = 'limited';
    }
    const billable = status === 'unavailable' ? 0 : Math.min(quantity, available);
    lines.push({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      brandName: db.brands.find((b) => b.id === product.brandId)?.name ?? '',
      variantName: variant.name === 'Default' ? null : variant.name,
      variantLabel: product.variantLabel,
      sku: variant.sku,
      image: variant.image || product.images[0],
      categoryId: product.categoryId,
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice ?? null,
      quantity,
      billableQuantity: billable,
      available,
      stockStatus: variantStockStatus(variant, product.lowStockThreshold),
      lowStockThreshold: product.lowStockThreshold,
      lineTotal: Math.round(variant.price * billable * 100) / 100,
      status,
      reason,
    });
  }

  const billableItems = lines.filter((l) => l.status !== 'unavailable').map((l) => ({ unitPrice: l.unitPrice, quantity: l.billableQuantity, categoryId: l.categoryId }));
  const subtotal = billableItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  let coupon = null;
  let couponResult = null;
  if (couponCode) {
    const code = String(couponCode).trim().toUpperCase();
    const record = db.coupons.find((c) => c.code === code);
    const usageByCustomer = customerKey
      ? db.orders.filter((o) => o.couponCode === code && o.status !== 'cancelled' && (o.customer.email === customerKey.email || o.customer.phone === customerKey.phone)).length
      : 0;
    couponResult = evaluateCoupon(record, { subtotal, items: billableItems, customerKey, usageByCustomer });
    coupon = { code, valid: couponResult.valid, message: couponResult.message, type: record?.type ?? null };
  }

  const totals = computeTotals({ items: billableItems, settings: db.settings, governorate, couponResult });
  const blocking = lines.filter((l) => l.status === 'unavailable');
  return {
    items: lines,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    ...totals,
    coupon,
    canCheckout: lines.length > 0 && blocking.length === 0 && !lines.some((l) => l.status === 'adjusted'),
    issues: [
      ...blocking.map((l) => ({ variantId: l.variantId, type: 'unavailable', message: `${l.name}${l.variantName ? ` (${l.variantName})` : ''} is no longer available.` })),
      ...lines
        .filter((l) => l.status === 'adjusted')
        .map((l) => ({ variantId: l.variantId, type: 'adjusted', available: l.available, message: `Only ${l.available} of ${l.name}${l.variantName ? ` (${l.variantName})` : ''} available.` })),
    ],
  };
}

// ───────────────────────────── inventory
/** Applies a stock delta to one variant and writes an audit entry. */
export function adjustStock(db, { productId, variantId, delta, type, note = '', by = 'System', orderRef = null }) {
  const { product, variant } = findVariant(db, productId, variantId);
  if (!product || !variant) throw new HttpError(404, 'Variant not found.');
  const before = variant.stock;
  const after = before + delta;
  if (after < 0) throw new HttpError(409, `Stock for ${variant.sku} cannot go below zero.`, { code: 'NEGATIVE_STOCK' });
  variant.stock = after;
  const entry = { id: newId('adj'), productId, variantId, sku: variant.sku, type, delta, before, after, note, by, orderRef, at: new Date().toISOString() };
  db.inventoryLog.unshift(entry);
  // Back in stock → restock requests become ready to notify.
  if (before <= 0 && after > 0) {
    db.restockRequests.forEach((r) => {
      if (r.variantId === variantId && r.status === 'waiting') r.status = 'ready';
    });
  }
  return entry;
}

/** Puts an order's items back into stock exactly once. */
export function restoreOrderInventory(db, order, { by, reason }) {
  if (order.inventoryRestored) return false;
  for (const item of order.items) {
    const { variant } = findVariant(db, item.productId, item.variantId);
    if (!variant) continue; // deleted products cannot be restocked
    adjustStock(db, { productId: item.productId, variantId: item.variantId, delta: item.quantity, type: 'return', note: `${reason} — ${order.reference}`, by, orderRef: order.reference });
  }
  order.inventoryRestored = true;
  return true;
}

// ───────────────────────────── orders
export function serializeOrder(order, { admin = false } = {}) {
  const out = JSON.parse(JSON.stringify(order));
  if (!admin) {
    delete out.notes;
    out.items.forEach((i) => delete i.categoryId);
  }
  return out;
}

export function nextOrderReference(db) {
  const max = db.orders.reduce((m, o) => Math.max(m, Number(o.reference.split('-')[1]) || 0), 10000);
  return `LUMA-${max + 1}`;
}
