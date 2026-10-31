import type { Metadata } from "next";
import Link from "next/link";
import { getFaqs } from "@/data/faq";
import { PageHeader } from "@/components/ui/PageHeader";
import { FaqList } from "@/components/home/FAQ";
import { JsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about the AURELLE Steam Eye Mask, delivery in Lebanon and payment.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  // Only answered questions go into FAQPage structured data.
  const answered = getFaqs().filter((f) => f.answer);
  return (
    <>
      {answered.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: answered.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }}
        />
      )}
      <PageHeader
        eyebrow="FAQ"
        title="Good to Know"
        intro={
          <>
            Everything you might wonder about your new ritual. Something else on your mind?{" "}
            <Link href="/contact" className="text-ink underline underline-offset-4">
              Contact us
            </Link>
            .
          </>
        }
      />
      <section className="py-16 md:py-24">
        <div className="container-site max-w-4xl">
          <FaqList />
        </div>
      </section>
    </>
  );
}
