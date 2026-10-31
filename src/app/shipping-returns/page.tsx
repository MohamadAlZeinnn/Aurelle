import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import { formatUSD } from "@/lib/currency";
import { PageHeader } from "@/components/ui/PageHeader";
import { DraftNotice } from "@/components/ui/DraftNotice";
import { PlaceholderTag, freeDeliveryLabel } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Delivery across Lebanon, fees, Cash on Delivery and returns for AURELLE orders.",
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  const { deliveryFee, deliveryEstimate, returnsWindowDays } = siteConfig.shipping;
  const threshold = freeDeliveryLabel();
  const rows: [string, React.ReactNode][] = [
    ["Where we deliver", `Across ${siteConfig.market}`],
    [
      "Delivery fee",
      <span key="fee" className="inline-flex items-center gap-2">
        {formatUSD(deliveryFee.amount)} {deliveryFee.isPlaceholder && <PlaceholderTag />}
      </span>,
    ],
    ["Complimentary delivery", threshold ? `On orders above ${threshold}` : "—"],
    ["Delivery time", deliveryEstimate ?? <em key="eta">To be confirmed</em>],
    ["Payment", siteConfig.payments.cashOnDelivery ? "Cash on Delivery (USD)" : "Shown at checkout"],
  ];

  return (
    <>
      <PageHeader eyebrow="Customer Care" title="Shipping & Returns" intro="Everything you need to know about receiving your AURELLE order in Lebanon." />
      <section className="py-16 md:py-24">
        <div className="container-site max-w-3xl">
          {(!deliveryEstimate || deliveryFee.isPlaceholder) && (
            <DraftNotice>Delivery times and fees are still being confirmed with our delivery partner.</DraftNotice>
          )}
          <h2 className="font-serif text-3xl">Delivery</h2>
          <dl className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-5 sm:grid-cols-3">
                <dt className="text-[0.7rem] font-medium tracking-[0.16em] text-stone uppercase">{k}</dt>
                <dd className="sm:col-span-2">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="prose-aurelle mt-6">
            <p>Our delivery partner will contact you by phone before arriving, so please make sure the number you enter at checkout is reachable.</p>
          </div>

          <h2 className="mt-16 font-serif text-3xl">Returns</h2>
          <div className="prose-aurelle mt-6">
            <p>
              {returnsWindowDays
                ? `Unopened items in their original packaging may be returned within ${returnsWindowDays} days of delivery.`
                : "Our full returns policy will be published before launch."}{" "}
              If anything arrives damaged or incorrect, please <Link href="/contact">contact us</Link> and we will make it right.
            </p>
            <p>
              Read our full <Link href="/policies/refund">Refund Policy</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
