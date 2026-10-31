import { siteConfig } from "@/data/site-config";
import { formatUSD } from "@/lib/currency";
import type { Product } from "@/types/product";

/** wa.me link to the store's WhatsApp, optionally with a pre-filled message. */
export function whatsappUrl(message?: string): string {
  const number = siteConfig.ordering.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/**
 * Pre-filled order message. The price is only included once it is confirmed,
 * so customers are never quoted a placeholder amount.
 */
export function orderMessage(product: Product, quantity: number, variantName?: string): string {
  const details = [product.pack?.label, variantName].filter(Boolean).join(", ");
  const item = `${product.brand} ${product.name}${details ? ` (${details})` : ""}`;
  const price = product.price.isPlaceholder ? "" : ` — ${formatUSD(product.price.amount * quantity)}`;
  return [
    `Hello ${product.brand}, I would like to order:`,
    `• ${item} × ${quantity}${price}`,
    "",
    "Name:",
    "Area / City:",
    "Address:",
  ].join("\n");
}

export function generalEnquiryUrl(): string {
  return whatsappUrl(`Hello ${siteConfig.name}, I have a question.`);
}
