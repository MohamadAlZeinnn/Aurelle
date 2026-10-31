import { siteConfig } from "@/data/site-config";
import { getProductById, resolvePrice } from "@/lib/product";
import { roundMoney } from "@/lib/currency";
import type { CartLine, OrderTotals, PricedLine } from "@/types/order";

/**
 * Prices cart lines against the catalogue. Shared by the client (display) and
 * the server (authoritative order creation) — clients never send prices.
 * Lines for unknown / inactive products or variants are dropped.
 */
export function priceLines(lines: CartLine[]): PricedLine[] {
  return lines.flatMap((line) => {
    const product = getProductById(line.productId);
    if (!product) return [];
    const variant = line.variantId ? product.variants.find((v) => v.id === line.variantId) : undefined;
    if (line.variantId && !variant) return [];
    const price = resolvePrice(product, line.variantId);
    const quantity = Math.max(1, Math.min(line.quantity, product.maxPerOrder));
    return [
      {
        ...line,
        quantity,
        name: product.name,
        variantName: variant?.name,
        unitPrice: price.amount,
        lineTotal: roundMoney(price.amount * quantity),
        isPlaceholderPrice: price.isPlaceholder,
      },
    ];
  });
}

export function computeTotals(priced: PricedLine[]): OrderTotals {
  const { deliveryFee, freeDeliveryThreshold } = siteConfig.shipping;
  const subtotal = roundMoney(priced.reduce((sum, l) => sum + l.lineTotal, 0));
  const freeDeliveryApplied = !!freeDeliveryThreshold && subtotal >= freeDeliveryThreshold.amount;
  const fee = priced.length === 0 || freeDeliveryApplied ? 0 : deliveryFee.amount;
  return {
    subtotal,
    deliveryFee: fee,
    total: roundMoney(subtotal + fee),
    freeDeliveryApplied,
    containsPlaceholders:
      priced.some((l) => l.isPlaceholderPrice) || deliveryFee.isPlaceholder || !!freeDeliveryThreshold?.isPlaceholder,
  };
}

/** How much more the customer needs to spend for free delivery, or null. */
export function amountToFreeDelivery(subtotal: number): number | null {
  const threshold = siteConfig.shipping.freeDeliveryThreshold;
  if (!threshold || subtotal >= threshold.amount) return null;
  return roundMoney(threshold.amount - subtotal);
}
