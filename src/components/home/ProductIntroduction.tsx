import { getProductById } from "@/lib/product";
import { FEATURED_PRODUCT_ID } from "@/data/products";
import { SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { ProductFeature } from "@/components/product/ProductFeature";

export function ProductIntroduction() {
  const product = getProductById(FEATURED_PRODUCT_ID);
  if (!product) return null;
  return (
    <section aria-labelledby="ritual-title" className="py-[var(--spacing-section)]">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow="The Collection"
            title={<span id="ritual-title">Meet Your New Ritual</span>}
            intro="A simple moment of warmth. A little time just for you."
          />
        </Reveal>
        <div className="mt-16 md:mt-24">
          <ProductFeature product={product} />
        </div>
      </div>
    </section>
  );
}
