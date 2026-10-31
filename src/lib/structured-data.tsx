import { siteConfig } from "@/data/site-config";
import { productHref } from "@/lib/product";
import type { Product } from "@/types/product";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped is safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    slogan: siteConfig.tagline,
    areaServed: { "@type": "Country", name: siteConfig.market },
    sameAs: [siteConfig.social.instagram, siteConfig.social.tiktok].filter((u) => !/\.com\/?$/.test(u)),
  };
}

/**
 * Product structured data built only from confirmed data: placeholder prices
 * are omitted (no `offers`), and no ratings or reviews are emitted.
 */
export function productJsonLd(product: Product) {
  const url = `${siteConfig.url}${productHref(product)}`;
  const images = product.images.filter((i) => i.src).map((i) => `${siteConfig.url}${i.src}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name}`,
    description: product.shortDescription,
    brand: { "@type": "Brand", name: product.brand },
    url,
    ...(images.length && { image: images }),
    ...(product.sku && { sku: product.sku }),
    ...(product.gtin && { gtin: product.gtin }),
    ...(!product.price.isPlaceholder && {
      offers: {
        "@type": "Offer",
        url,
        price: product.price.amount.toFixed(2),
        priceCurrency: siteConfig.currency.primary,
        availability:
          product.availability === "in_stock"
            ? "https://schema.org/InStock"
            : product.availability === "preorder"
              ? "https://schema.org/PreOrder"
              : "https://schema.org/OutOfStock",
        areaServed: { "@type": "Country", name: siteConfig.market },
      },
    }),
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.href}`,
    })),
  };
}
