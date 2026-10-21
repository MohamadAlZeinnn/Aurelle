// Presentation rules for products that both the server serializer and UI rely on.
import { productStockStatus, variantStockStatus } from './inventory.js';

export function ratingSummary(reviews) {
  const approved = reviews.filter((r) => r.status === 'approved');
  if (!approved.length) return { average: null, count: 0 };
  const avg = approved.reduce((s, r) => s + r.rating, 0) / approved.length;
  return { average: Math.round(avg * 10) / 10, count: approved.length };
}

/** Badges in display priority. Only truthful, data-backed states. */
export function productBadges(product) {
  const badges = [];
  const status = product.stockStatus ?? productStockStatus(product);
  if (status === 'out_of_stock' || status === 'discontinued') badges.push({ key: 'sold-out', label: 'Sold out' });
  if (product.onSale && status !== 'out_of_stock') badges.push({ key: 'sale', label: 'Sale' });
  if (product.isNew) badges.push({ key: 'new', label: 'New' });
  if (product.isBestseller) badges.push({ key: 'bestseller', label: 'Bestseller' });
  if (status === 'low_stock') badges.push({ key: 'limited', label: 'Limited stock' });
  return badges.slice(0, 2);
}

export function priceRange(variants) {
  const active = variants.filter((v) => !v.discontinued);
  const list = active.length ? active : variants;
  const prices = list.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export const variantLabel = (variant) => (variant && variant.name !== 'Default' ? variant.name : null);

export const hasRealVariants = (product) => (product?.variants?.length ?? 0) > 1 || (product?.variants?.[0] && product.variants[0].name !== 'Default');

export { variantStockStatus };
