import "server-only";
import { isStoreConfigured } from "@/lib/server/store";
import { computeTotals, priceLines } from "@/lib/pricing";
import { getActiveProducts } from "@/lib/product";
import type { CheckoutMode } from "@/types/order";

export interface CheckoutStatus {
  mode: CheckoutMode;
  /** Human-readable reasons the store is in demo mode. */
  reasons: string[];
}

/**
 * Orders are only recorded ("live") when storage is configured AND no price or
 * delivery fee is still a placeholder. Otherwise checkout runs in demo mode:
 * the form is fully validated server-side but nothing is recorded or charged.
 */
export function getCheckoutStatus(): CheckoutStatus {
  const reasons: string[] = [];
  if (!isStoreConfigured()) reasons.push("Order storage (Supabase) is not configured.");

  const anyLines = getActiveProducts().map((p) => ({ productId: p.id, quantity: 1 }));
  if (computeTotals(priceLines(anyLines)).containsPlaceholders) {
    reasons.push("Product prices or delivery fees are still placeholders.");
  }
  return { mode: reasons.length ? "demo" : "live", reasons };
}
