import Link from "next/link";
import type { Product } from "@/types/product";
import { productHref } from "@/lib/product";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { PurchaseControls } from "@/components/product/PurchaseControls";

/**
 * Large editorial product presentation — used instead of a conventional grid
 * while the collection is small. `index` drives the "N°" numbering and
 * alternates the layout for future products.
 */
export function ProductFeature({ product, index = 0 }: { product: Product; index?: number }) {
  const [main, detail] = [product.images[0], product.images[1]];
  const reversed = index % 2 === 1;

  return (
    <article className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
      <div className={`relative lg:col-span-7 ${reversed ? "lg:order-2 lg:col-start-6" : ""}`}>
        <Link href={productHref(product)} aria-label={`View ${product.name}`} className="block">
          <ImageReveal className="aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] lg:w-[86%]">
            <EditorialImage
              src={main.src}
              alt={main.alt}
              motif={main.motif}
              brief={main.brief} isPlaceholder={main.isPlaceholder} focus={main.focus} fit={main.fit}
              tone="sand"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full"
            />
          </ImageReveal>
        </Link>
        {detail && (
          <div className="absolute right-0 bottom-[-8%] hidden w-[38%] border-[10px] border-ivory lg:block">
            <ImageReveal className="aspect-square" delay={0.25}>
              <EditorialImage src={detail.src} alt={detail.alt} motif={detail.motif} brief={detail.brief} isPlaceholder={detail.isPlaceholder} focus={detail.focus} fit={detail.fit} compact sizes="20vw" className="h-full w-full" />
            </ImageReveal>
          </div>
        )}
      </div>

      <Reveal className={`lg:col-span-5 ${reversed ? "lg:order-1 lg:col-start-1" : "lg:pl-8"}`}>
        <p className="eyebrow">
          N°{String(index + 1).padStart(2, "0")} · {product.brand}
        </p>
        <h3 className="mt-5 text-headline font-light">{product.name}</h3>
        <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-stone">{product.cardDescription}</p>
        <div className="mt-10 border-t border-ink/12 pt-8">
          <PurchaseControls productId={product.id} variant="compact" />
        </div>
        <Link href={productHref(product)} className="link-line mt-8">
          View Details
        </Link>
      </Reveal>
    </article>
  );
}
