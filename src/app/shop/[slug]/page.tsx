import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveProducts, getProductBySlug, productHref } from "@/lib/product";
import { getAvailablePaymentMethods } from "@/lib/server/payments";
import { breadcrumbJsonLd, JsonLd, productJsonLd } from "@/lib/structured-data";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInformation } from "@/components/product/ProductInformation";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { HowToUse } from "@/components/home/HowToUse";
import { FAQ } from "@/components/home/FAQ";
import { Reveal } from "@/components/ui/Reveal";

export function generateStaticParams() {
  return getActiveProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: { canonical: productHref(product) },
    openGraph: { title: `${product.brand} ${product.name}`, description: product.seo.description, url: productHref(product) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProductBySlug((await params).slug);
  if (!product) notFound();

  const paymentLabels = getAvailablePaymentMethods().map((m) => m.label);

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: product.name, href: productHref(product) },
        ])}
      />

      <section className="pb-[var(--spacing-section)] lg:pt-10">
        <div className="lg:container-site grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} productName={product.name} />
          </div>
          <div className="container-site lg:col-span-5 lg:px-0">
            <div className="lg:sticky lg:top-28">
              <ProductInformation product={product} paymentLabels={paymentLabels} />
            </div>
          </div>
        </div>
      </section>

      <section id="details" aria-labelledby="details-title" className="border-t border-ink/10 bg-linen py-[var(--spacing-section)]">
        <div className="container-site grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="eyebrow">The Details</p>
            <h2 id="details-title" className="mt-6 text-headline font-light">
              {product.story[0]}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-7">
            <ProductAccordion product={product} />
          </Reveal>
        </div>
      </section>

      <HowToUse />
      <div className="border-t border-ink/10">
        <FAQ />
      </div>

      <StickyBuyBar productId={product.id} />
    </>
  );
}
