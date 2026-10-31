import type { Metadata } from "next";
import { getActiveProducts } from "@/lib/product";
import { ProductFeature } from "@/components/product/ProductFeature";
import { SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop AURELLE self-care essentials, delivered across Lebanon. Discover the Steam Eye Mask.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const products = getActiveProducts();
  return (
    <>
      <section className="pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="Shop"
              title="Rituals for Slower Days"
              intro="Considered essentials for small moments of calm. This is where our collection begins."
            />
          </Reveal>
        </div>
      </section>
      <section aria-label="Products" className="pb-[var(--spacing-section)]">
        <div className="container-site space-y-[var(--spacing-section)]">
          {products.map((p, i) => (
            <ProductFeature key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
