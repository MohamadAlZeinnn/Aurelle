import { HttpError, notFound, paginate, validate } from '../http.js';
import { newId } from '../db.js';
import { adjustStock, serializeProduct } from '../domain.js';
import { categorySchema, productSchema, stockAdjustmentSchema } from '../../../lib/adminValidation.js';
import { variantStockStatus } from '../../../lib/inventory.js';

const ADMIN = { auth: 'admin' };

function assertUniqueSkus(db, variants, productId) {
  for (const v of variants) {
    const clash = db.products.find((p) => p.id !== productId && p.variants.some((x) => x.sku.toUpperCase() === v.sku.toUpperCase()));
    if (clash) throw new HttpError(409, `SKU ${v.sku} is already used by “${clash.name}”.`, { code: 'SKU_TAKEN' });
  }
}

export function registerAdminCatalogRoutes(router) {
  router.get(
    '/admin/products',
    ({ db, query }) => {
      let items = db.products.map((p) => serializeProduct(db, p, { admin: true }));
      if (query.q) {
        const q = query.q.toLowerCase();
        items = items.filter((p) => p.name.toLowerCase().includes(q) || p.variants.some((v) => v.sku.toLowerCase().includes(q)) || p.brand?.name.toLowerCase().includes(q));
      }
      if (query.status) items = items.filter((p) => p.status === query.status);
      if (query.category) items = items.filter((p) => p.categoryId === query.category);
      if (query.stock) items = items.filter((p) => p.stockStatus === query.stock);
      const sorters = {
        name: (a, b) => a.name.localeCompare(b.name),
        updated: (a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
        price: (a, b) => a.priceMin - b.priceMin,
        stock: (a, b) => a.variants.reduce((s, v) => s + v.stock, 0) - b.variants.reduce((s, v) => s + v.stock, 0),
        sales: (a, b) => b.salesCount - a.salesCount,
      };
      items.sort(sorters[query.sort] || sorters.updated);
      if (query.dir === 'desc' && ['name', 'price', 'stock'].includes(query.sort)) items.reverse();
      return paginate(items, query.page, query.pageSize || 20);
    },
    ADMIN
  );

  router.get(
    '/admin/products/:id',
    ({ db, params }) => {
      const p = db.products.find((x) => x.id === params.id);
      if (!p) throw notFound('Product');
      return serializeProduct(db, p, { admin: true });
    },
    ADMIN
  );

  router.post(
    '/admin/products',
    ({ db, body, user }) => {
      const data = validate(productSchema, body);
      if (db.products.some((p) => p.slug === data.slug)) throw new HttpError(409, 'Another product already uses this URL handle.', { errors: { slug: 'Already in use.' } });
      assertUniqueSkus(db, data.variants);
      const now = new Date().toISOString();
      const product = {
        id: newId('p'),
        ...data,
        subcategoryId: data.subcategoryId || null,
        variantLabel: data.variantLabel || null,
        variants: data.variants.map((v) => ({ ...v, id: newId('v'), stock: 0 })),
        createdAt: now,
        updatedAt: now,
        salesCount: 0,
      };
      db.products.unshift(product);
      // Opening stock is recorded through the audit trail.
      data.variants.forEach((v, i) => {
        if (v.stock > 0) adjustStock(db, { productId: product.id, variantId: product.variants[i].id, delta: v.stock, type: 'restock', note: 'Opening stock', by: user.fullName });
      });
      return serializeProduct(db, product, { admin: true });
    },
    ADMIN
  );

  router.put(
    '/admin/products/:id',
    ({ db, body, params, user }) => {
      const product = db.products.find((x) => x.id === params.id);
      if (!product) throw notFound('Product');
      const data = validate(productSchema, body);
      if (db.products.some((p) => p.slug === data.slug && p.id !== product.id)) throw new HttpError(409, 'Another product already uses this URL handle.', { errors: { slug: 'Already in use.' } });
      assertUniqueSkus(db, data.variants, product.id);

      const nextVariants = data.variants.map((v) => {
        const existing = v.id && product.variants.find((x) => x.id === v.id);
        return existing ? { ...existing, ...v, stock: existing.stock, _targetStock: v.stock } : { ...v, id: newId('v'), stock: 0, _targetStock: v.stock };
      });
      const removed = product.variants.filter((v) => !nextVariants.some((n) => n.id === v.id));
      const { variants: _ignored, ...rest } = data;
      Object.assign(product, rest, { subcategoryId: data.subcategoryId || null, variantLabel: data.variantLabel || null, updatedAt: new Date().toISOString() });
      product.variants = nextVariants.map(({ _targetStock, ...v }) => v);
      // Any stock difference typed into the form is logged as a correction.
      nextVariants.forEach((v) => {
        const delta = v._targetStock - v.stock;
        if (delta !== 0) adjustStock(db, { productId: product.id, variantId: v.id, delta, type: 'correction', note: 'Edited in product form', by: user.fullName });
      });
      removed.forEach((v) => db.inventoryLog.unshift({ id: newId('adj'), productId: product.id, variantId: v.id, sku: v.sku, type: 'correction', delta: -v.stock, before: v.stock, after: 0, note: 'Variant removed', by: user.fullName, at: new Date().toISOString() }));
      return serializeProduct(db, product, { admin: true });
    },
    ADMIN
  );

  router.patch(
    '/admin/products/:id',
    ({ db, body, params }) => {
      const product = db.products.find((x) => x.id === params.id);
      if (!product) throw notFound('Product');
      const allowed = ['status', 'isFeatured', 'isNew', 'isBestseller'];
      for (const key of allowed) if (key in (body || {})) product[key] = body[key];
      if (body?.status && !['draft', 'published', 'archived'].includes(body.status)) throw new HttpError(400, 'Unknown status.');
      if (body?.status === 'published' && (!product.images.length || !product.description)) throw new HttpError(422, 'Add images and a description before publishing.');
      product.updatedAt = new Date().toISOString();
      return serializeProduct(db, product, { admin: true });
    },
    ADMIN
  );

  router.delete(
    '/admin/products/:id',
    ({ db, params }) => {
      const product = db.products.find((x) => x.id === params.id);
      if (!product) throw notFound('Product');
      const hasOrders = db.orders.some((o) => o.items.some((i) => i.productId === product.id));
      if (hasOrders) throw new HttpError(409, 'This product appears in past orders, so it cannot be deleted. Archive it instead to hide it from the shop.', { code: 'HAS_ORDERS' });
      db.products = db.products.filter((p) => p.id !== product.id);
      db.content.featuredCollections.forEach((c) => (c.productIds = c.productIds.filter((id) => id !== product.id)));
      return { ok: true };
    },
    ADMIN
  );

  // ───────────── inventory
  router.get(
    '/admin/inventory',
    ({ db, query }) => {
      let rows = db.products.flatMap((p) =>
        p.variants.map((v) => ({
          productId: p.id,
          productName: p.name,
          productStatus: p.status,
          image: v.image || p.images[0],
          variantId: v.id,
          variantName: v.name,
          sku: v.sku,
          stock: v.stock,
          price: v.price,
          lowStockThreshold: p.lowStockThreshold,
          discontinued: v.discontinued,
          status: variantStockStatus(v, p.lowStockThreshold),
          waitlist: db.restockRequests.filter((r) => r.variantId === v.id && r.status !== 'notified').length,
          categoryId: p.categoryId,
        }))
      );
      const summary = {
        in_stock: rows.filter((r) => r.status === 'in_stock').length,
        low_stock: rows.filter((r) => r.status === 'low_stock').length,
        out_of_stock: rows.filter((r) => r.status === 'out_of_stock').length,
        discontinued: rows.filter((r) => r.status === 'discontinued').length,
        units: rows.reduce((s, r) => s + (r.discontinued ? 0 : r.stock), 0),
      };
      if (query.q) {
        const q = query.q.toLowerCase();
        rows = rows.filter((r) => r.productName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.variantName.toLowerCase().includes(q));
      }
      if (query.status) rows = rows.filter((r) => r.status === query.status);
      if (query.category) rows = rows.filter((r) => r.categoryId === query.category);
      const order = { out_of_stock: 0, low_stock: 1, in_stock: 2, discontinued: 3 };
      rows.sort((a, b) => order[a.status] - order[b.status] || a.stock - b.stock || a.productName.localeCompare(b.productName));
      return { ...paginate(rows, query.page, query.pageSize || 25), summary };
    },
    ADMIN
  );

  router.post(
    '/admin/inventory/adjustments',
    ({ db, body, user }) => {
      const data = validate(stockAdjustmentSchema, body);
      const product = db.products.find((p) => p.id === data.productId);
      const variant = product?.variants.find((v) => v.id === data.variantId);
      if (!variant) throw notFound('Variant');
      let delta = data.quantity;
      if (data.mode === 'remove') delta = -data.quantity;
      if (data.mode === 'set') delta = data.quantity - variant.stock;
      if (delta === 0) throw new HttpError(400, 'This adjustment would not change the stock level.');
      if (variant.stock + delta < 0) throw new HttpError(400, `You can remove at most ${variant.stock} units.`, { errors: { quantity: `Maximum ${variant.stock}.` } });
      return adjustStock(db, { productId: product.id, variantId: variant.id, delta, type: data.type, note: data.note || '', by: user.fullName });
    },
    ADMIN
  );

  router.patch(
    '/admin/inventory/:variantId',
    ({ db, params, body }) => {
      const product = db.products.find((p) => p.variants.some((v) => v.id === params.variantId));
      if (!product) throw notFound('Variant');
      const variant = product.variants.find((v) => v.id === params.variantId);
      if ('discontinued' in (body || {})) variant.discontinued = Boolean(body.discontinued);
      if ('lowStockThreshold' in (body || {})) {
        const t = Number(body.lowStockThreshold);
        if (!Number.isInteger(t) || t < 0) throw new HttpError(400, 'Threshold must be a whole number.');
        product.lowStockThreshold = t;
      }
      return { ok: true };
    },
    ADMIN
  );

  router.get(
    '/admin/inventory/adjustments',
    ({ db, query }) => {
      let rows = db.inventoryLog;
      if (query.variantId) rows = rows.filter((r) => r.variantId === query.variantId);
      if (query.type) rows = rows.filter((r) => r.type === query.type);
      if (query.q) {
        const q = query.q.toLowerCase();
        rows = rows.filter((r) => r.sku.toLowerCase().includes(q) || (r.note || '').toLowerCase().includes(q));
      }
      rows = rows.map((r) => ({ ...r, productName: db.products.find((p) => p.id === r.productId)?.name ?? 'Deleted product' }));
      return paginate(rows, query.page, query.pageSize || 25);
    },
    ADMIN
  );

  // ───────────── categories
  router.get('/admin/categories', ({ db }) => db.categories.map((c) => ({ ...c, productCount: db.products.filter((p) => p.categoryId === c.id).length })).sort((a, b) => a.sortOrder - b.sortOrder), ADMIN);

  router.post(
    '/admin/categories',
    ({ db, body }) => {
      const data = validate(categorySchema, body);
      if (db.categories.some((c) => c.slug === data.slug)) throw new HttpError(409, 'This handle is already used.', { errors: { slug: 'Already in use.' } });
      const cat = { id: newId('cat'), ...data, subcategories: data.subcategories.map((s) => ({ ...s, id: s.id || newId('sub') })) };
      db.categories.push(cat);
      return cat;
    },
    ADMIN
  );

  router.put(
    '/admin/categories/:id',
    ({ db, body, params }) => {
      const cat = db.categories.find((c) => c.id === params.id);
      if (!cat) throw notFound('Category');
      const data = validate(categorySchema, body);
      if (db.categories.some((c) => c.slug === data.slug && c.id !== cat.id)) throw new HttpError(409, 'This handle is already used.', { errors: { slug: 'Already in use.' } });
      const removedSubs = cat.subcategories.filter((s) => !data.subcategories.some((n) => n.id === s.id));
      const inUse = removedSubs.find((s) => db.products.some((p) => p.subcategoryId === s.id));
      if (inUse) throw new HttpError(409, `“${inUse.name}” still has products. Move them before removing it.`);
      Object.assign(cat, data, { subcategories: data.subcategories.map((s) => ({ ...s, id: s.id || newId('sub') })) });
      return cat;
    },
    ADMIN
  );

  router.delete(
    '/admin/categories/:id',
    ({ db, params }) => {
      const count = db.products.filter((p) => p.categoryId === params.id).length;
      if (count) throw new HttpError(409, `This category still contains ${count} product${count === 1 ? '' : 's'}. Move or delete them first.`);
      db.categories = db.categories.filter((c) => c.id !== params.id);
      return { ok: true };
    },
    ADMIN
  );
}
