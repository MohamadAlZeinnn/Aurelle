"use client";

import { useState } from "react";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Price } from "@/components/ui/primitives";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { AVAILABILITY_LABEL, getProductById, isPurchasable, packSummary, resolvePrice } from "@/lib/product";
import { orderMessage, whatsappUrl } from "@/lib/whatsapp";

interface Props {
  productId: string;
  /** "full" = product page (quantity selector + note); "compact" = editorial card. */
  variant?: "full" | "compact";
}

/** Orders are placed on WhatsApp — the button opens a chat with the selection pre-filled. */
export function PurchaseControls({ productId, variant = "full" }: Props) {
  const product = getProductById(productId)!;
  const firstAvailable = product.variants.find((v) => v.available)?.id;
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable);
  const [quantity, setQuantity] = useState(1);

  const price = resolvePrice(product, variantId);
  const purchasable = isPurchasable(product, variantId);
  const variantName = product.variants.find((v) => v.id === variantId)?.name;
  const pack = packSummary(product);
  const href = whatsappUrl(orderMessage(product, quantity, variantName));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Price amount={price.amount} isPlaceholder={price.isPlaceholder} className={variant === "full" ? "font-serif text-3xl" : "font-serif text-2xl"} />
        <span className="flex items-center gap-2 text-xs tracking-[0.14em] text-stone uppercase">
          <span className={`h-1.5 w-1.5 rounded-full ${purchasable ? "bg-[#8a9a7b]" : "bg-taupe"}`} aria-hidden />
          {AVAILABILITY_LABEL[product.availability]}
        </span>
      </div>
      {pack && <p className="mt-2 text-sm text-stone">{pack}</p>}

      {product.variants.length > 0 && (
        <fieldset className="mt-7">
          <legend className="eyebrow mb-3">Scent</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <label
                key={v.id}
                className={`cursor-pointer border px-4 py-2.5 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-1 ${
                  variantId === v.id ? "border-ink bg-ink text-ivory" : "border-ink/20 hover:border-ink"
                } ${!v.available ? "pointer-events-none opacity-40 line-through" : ""}`}
              >
                <input
                  type="radio"
                  name={`variant-${product.id}`}
                  value={v.id}
                  checked={variantId === v.id}
                  disabled={!v.available}
                  onChange={() => setVariantId(v.id)}
                  className="sr-only"
                />
                {v.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {variant === "full" && (
          <QuantitySelector value={quantity} onChange={setQuantity} max={product.maxPerOrder} label="Quantity" />
        )}
        {purchasable ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary min-w-0 flex-1 sm:min-w-[16rem] sm:flex-none"
          >
            <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
            <span className="sr-only">(opens WhatsApp)</span>
          </a>
        ) : (
          <button type="button" className="btn btn-primary min-w-0 flex-1 sm:min-w-[16rem] sm:flex-none" disabled>
            Currently Unavailable
          </button>
        )}
      </div>
      {variant === "full" && purchasable && (
        <p className="mt-4 text-sm text-stone">
          Your order is confirmed with our team on WhatsApp. Pay cash on delivery.
        </p>
      )}
    </div>
  );
}
