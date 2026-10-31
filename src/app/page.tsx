import { Hero } from "@/components/home/Hero";
import { ProductIntroduction } from "@/components/home/ProductIntroduction";
import { Benefits } from "@/components/home/Benefits";
import { LifestyleSection } from "@/components/home/LifestyleSection";
import { HowToUse } from "@/components/home/HowToUse";
import { BrandPhilosophy } from "@/components/home/BrandPhilosophy";
import { FAQ } from "@/components/home/FAQ";
import { Newsletter } from "@/components/home/Newsletter";
import { JsonLd, organizationJsonLd } from "@/lib/structured-data";

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Hero />
      <ProductIntroduction />
      <Benefits />
      <LifestyleSection />
      <HowToUse />
      <BrandPhilosophy />
      <FAQ />
      <Newsletter />
    </>
  );
}
