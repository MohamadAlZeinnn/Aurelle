"use client";

import Link from "next/link";
import { getProductById, productHref } from "@/lib/product";
import { useCart } from "@/components/cart/CartProvider";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Price } from "@/components/ui/primitives";
import type { PricedLine } from "@/types/order";

export function CartItem({ line, onNavigate }: { line: PricedLine; onNavigate?: () => void }) {
  const { setQuantity, remove } = useCart();
  const product = getProductById(line.productId);
  if (!product) return null;
  const image = product.images[0];

  return (
    <li className="flex gap-5 py-6">
      <Link href={productHref(product)} onClick={onNavigate} className="block w-24 shrink-0 sm:w-28">
        <EditorialImage
          src={image.src}
          alt={image.alt}
          motif={image.motif}
          brief={image.brief}
          sizes="112px"
          compact
          className="aspect-[4/5]"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow !text-[10px]">{product.brand}</p>
            <Link href={productHref(product)} onClick={onNavigate} className="mt-1 block font-serif text-xl leading-tight hover:text-clay">
              {line.name}
            </Link>
            {line.variantName && <p className="mt-1 text-sm text-stone">{line.variantName}</p>}
          </div>
          <Price amount={line.lineTotal} isPlaceholder={line.isPlaceholderPrice} showLbp={false} className="justify-end text-right text-sm" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <QuantitySelector
            size="sm"
            value={line.quantity}
            max={product.maxPerOrder}
            label={`Quantity of ${line.name}`}
            onChange={(q) => setQuantity(line.productId, q, line.variantId)}
          />
          <button
            type="button"
            onClick={() => remove(line.productId, line.variantId)}
            className="text-xs tracking-[0.12em] text-stone uppercase underline-offset-4 hover:text-ink hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
