// Inventory rules shared by the storefront, admin and demo server.
// Inventory always lives on a variant; single-SKU products have one "Default" variant.

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export function variantStockStatus(variant, threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
  if (!variant) return 'out_of_stock';
  if (variant.discontinued) return 'discontinued';
  const stock = Number(variant.stock) || 0;
  if (stock <= 0) return 'out_of_stock';
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
}

export const isVariantPurchasable = (variant) => Boolean(variant) && !variant.discontinued && Number(variant.stock) > 0;

export function productStockStatus(product) {
  const variants = product?.variants ?? [];
  const active = variants.filter((v) => !v.discontinued);
  if (!active.length) return 'discontinued';
  const statuses = active.map((v) => variantStockStatus(v, product.lowStockThreshold));
  if (statuses.every((s) => s === 'out_of_stock')) return 'out_of_stock';
  if (statuses.includes('in_stock')) return 'in_stock';
  return 'low_stock';
}

export const totalStock = (product) => (product?.variants ?? []).reduce((sum, v) => sum + (v.discontinued ? 0 : Math.max(0, Number(v.stock) || 0)), 0);

// First variant a shopper can actually buy, falling back to the first listed.
export const defaultVariant = (product) =>
  product?.variants?.find(isVariantPurchasable) ?? product?.variants?.find((v) => !v.discontinued) ?? product?.variants?.[0] ?? null;

export const clampQuantity = (quantity, available) => Math.max(0, Math.min(Number(quantity) || 0, Math.max(0, Number(available) || 0)));

// Truthful scarcity copy: only shown when the number is real and small.
export function lowStockMessage(variant, threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
  if (variantStockStatus(variant, threshold) !== 'low_stock') return null;
  return variant.stock === 1 ? 'Only 1 left in stock' : `Only ${variant.stock} left in stock`;
}
