"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Price } from "@/components/ui/primitives";
import { AVAILABILITY_LABEL, getProductById, isPurchasable, resolvePrice } from "@/lib/product";

interface Props {
  productId: string;
  /** "full" = product page (quantity + Buy Now); "compact" = editorial card. */
  variant?: "full" | "compact";
}

export function PurchaseControls({ productId, variant = "full" }: Props) {
  const product = getProductById(productId)!;
  const { add } = useCart();
  const router = useRouter();
  const firstAvailable = product.variants.find((v) => v.available)?.id;
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = resolvePrice(product, variantId);
  const purchasable = isPurchasable(product, variantId);

  const addToBag = () => {
    add(product.id, quantity, variantId);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const buyNow = () => {
    add(product.id, quantity, variantId);
    router.push("/checkout");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Price amount={price.amount} isPlaceholder={price.isPlaceholder} className={variant === "full" ? "font-serif text-3xl" : "font-serif text-2xl"} />
        <span className="flex items-center gap-2 text-xs tracking-[0.14em] text-stone uppercase">
          <span className={`h-1.5 w-1.5 rounded-full ${purchasable ? "bg-[#8a9a7b]" : "bg-taupe"}`} aria-hidden />
          {AVAILABILITY_LABEL[product.availability]}
        </span>
      </div>

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

      <div className={`mt-8 flex flex-wrap gap-3 ${variant === "full" ? "" : "items-center"}`}>
        {variant === "full" && (
          <QuantitySelector value={quantity} onChange={setQuantity} max={product.maxPerOrder} label="Quantity" />
        )}
        <button type="button" className="btn btn-primary min-w-0 flex-1 sm:min-w-[14rem] sm:flex-none" onClick={addToBag} disabled={!purchasable}>
          {added ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> Added to Bag
            </>
          ) : purchasable ? (
            "Add to Bag"
          ) : (
            "Currently Unavailable"
          )}
        </button>
        {variant === "full" && (
          <button type="button" className="btn btn-secondary w-full" onClick={buyNow} disabled={!purchasable}>
            Buy Now
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {added ? `${product.name} added to your bag` : ""}
      </p>
    </div>
  );
}
