import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site-config";
import { policies } from "@/data/policies";
import { getActiveProducts, productHref } from "@/lib/product";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/shop",
    ...getActiveProducts().map(productHref),
    "/about",
    "/faq",
    "/contact",
    "/shipping-returns",
    ...policies.map((p) => `/policies/${p.slug}`),
  ];
  return paths.map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: path.startsWith("/policies") ? "yearly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/shop") ? 0.9 : 0.5,
  }));
}
