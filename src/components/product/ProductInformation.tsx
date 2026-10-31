import Link from "next/link";
import { Banknote, Truck } from "lucide-react";
import type { Product } from "@/types/product";
import { siteConfig } from "@/data/site-config";
import { PurchaseControls } from "@/components/product/PurchaseControls";
import { freeDeliveryLabel } from "@/components/ui/primitives";
import { formatUSD } from "@/lib/currency";
import { whatsappUrl } from "@/lib/whatsapp";

export function ProductInformation({ product }: { product: Product }) {
  const { deliveryFee, deliveryEstimate } = siteConfig.shipping;
  const threshold = freeDeliveryLabel();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-xs tracking-[0.12em] text-stone uppercase">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-ink">Shop</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <p className="eyebrow mt-10">{product.brand}</p>
      <h1 className="mt-4 text-headline font-light">{product.name}</h1>
      {product.pack && <p className="mt-3 font-serif text-xl text-stone italic">{product.pack.label} masks</p>}
      <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-stone">{product.shortDescription}</p>

      <div className="mt-10 border-t border-ink/12 pt-8" id="purchase">
        <PurchaseControls productId={product.id} />
      </div>

      <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10 text-sm">
        <li className="flex gap-4 py-5">
          <Truck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-clay" strokeWidth={1.25} aria-hidden />
          <div>
            <p className="text-ink">Delivery across {siteConfig.market}</p>
            <p className="mt-1 text-stone">
              {deliveryEstimate ?? "Delivery times confirmed at dispatch."} Standard delivery {formatUSD(deliveryFee.amount)}
              {threshold && <> · complimentary on orders above {threshold}</>}.
            </p>
          </div>
        </li>
        <li className="flex gap-4 py-5">
          <Banknote className="mt-0.5 h-[18px] w-[18px] shrink-0 text-clay" strokeWidth={1.25} aria-hidden />
          <div>
            <p className="text-ink">Order on WhatsApp · Pay on delivery</p>
            <p className="mt-1 text-stone">
              Send us your order on WhatsApp at{" "}
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-ink underline underline-offset-4">
                {siteConfig.ordering.whatsappDisplay}
              </a>
              . We confirm the details with you, then you pay cash on delivery — prices in USD.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
