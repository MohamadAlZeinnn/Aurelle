"use client";

import { formatUSD, formatLBP } from "@/lib/currency";
import { amountToFreeDelivery } from "@/lib/pricing";
import { siteConfig } from "@/data/site-config";
import { PlaceholderTag } from "@/components/ui/primitives";
import type { OrderTotals } from "@/types/order";

export function FreeDeliveryProgress({ subtotal }: { subtotal: number }) {
  const threshold = siteConfig.shipping.freeDeliveryThreshold;
  if (!threshold) return null;
  const remaining = amountToFreeDelivery(subtotal);
  const pct = Math.min(100, (subtotal / threshold.amount) * 100);
  return (
    <div>
      <p className="text-[0.8rem] text-stone">
        {remaining === null ? (
          <>Your order qualifies for complimentary delivery.</>
        ) : (
          <>
            You are <span className="text-ink">{formatUSD(remaining)}</span> away from complimentary delivery.
          </>
        )}
      </p>
      <div className="mt-3 h-px w-full bg-ink/10" aria-hidden>
        <div className="h-px bg-ink transition-[width] duration-700 ease-[var(--ease-soft)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartSummary({ totals, compact = false }: { totals: OrderTotals; compact?: boolean }) {
  const { deliveryFee } = siteConfig.shipping;
  const lbp = formatLBP(totals.total);
  return (
    <dl className={`space-y-3 text-sm ${compact ? "" : "md:text-[0.95rem]"}`}>
      <div className="flex justify-between">
        <dt className="text-stone">Subtotal</dt>
        <dd className="tabular-nums">{formatUSD(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="flex items-center gap-2 text-stone">
          Delivery · {siteConfig.market}
          {deliveryFee.isPlaceholder && <PlaceholderTag />}
        </dt>
        <dd className="tabular-nums">{totals.freeDeliveryApplied ? "Complimentary" : formatUSD(totals.deliveryFee)}</dd>
      </div>
      <div className="rule !my-4" />
      <div className="flex items-baseline justify-between">
        <dt className="font-serif text-xl">Total</dt>
        <dd className="text-right">
          <span className="font-serif text-xl tabular-nums">{formatUSD(totals.total)}</span>
          {lbp && <span className="block text-xs text-stone">≈ {lbp} · charged in USD</span>}
        </dd>
      </div>
    </dl>
  );
}
