import { products } from "@/data/products";
import type { ConfigurableAmount, Product } from "@/types/product";

export function getActiveProducts(): Product[] {
  return products.filter((p) => p.active);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id && p.active);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug && p.active);
}

export function productHref(product: Pick<Product, "slug">): string {
  return `/shop/${product.slug}`;
}

/** Resolves the effective price for a product / optional variant. */
export function resolvePrice(product: Product, variantId?: string): ConfigurableAmount {
  const variant = variantId ? product.variants.find((v) => v.id === variantId) : undefined;
  return variant?.price ?? product.price;
}

export function isPurchasable(product: Product, variantId?: string): boolean {
  if (!product.active || product.availability === "out_of_stock") return false;
  if (variantId) return product.variants.some((v) => v.id === variantId && v.available);
  return product.variants.length === 0 || product.variants.some((v) => v.available);
}

export const AVAILABILITY_LABEL: Record<Product["availability"], string> = {
  in_stock: "In stock",
  out_of_stock: "Currently unavailable",
  preorder: "Available to pre-order",
};

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getActiveProducts().filter((p) =>
    [p.name, p.brand, p.shortDescription, ...p.variants.map((v) => v.name)].join(" ").toLowerCase().includes(q),
  );
}
