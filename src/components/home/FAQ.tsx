import Link from "next/link";
import { getFaqs } from "@/data/faq";
import { Accordion } from "@/components/ui/Accordion";
import { Pending, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";

export function FaqList() {
  return (
    <Accordion
      items={getFaqs().map((f) => ({
        id: f.id,
        title: f.question,
        content: f.answer ? <p>{f.answer}</p> : <Pending />,
      }))}
    />
  );
}

export function FAQ() {
  return (
    <section aria-labelledby="faq-title" className="py-[var(--spacing-section)]">
      <div className="container-site grid gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <SectionHeading align="left" eyebrow="Questions" title={<span id="faq-title">Good to Know</span>} />
          <p className="mt-6 max-w-xs text-stone">
            Can&apos;t find what you&apos;re looking for?{" "}
            <Link href="/contact" className="text-ink underline underline-offset-4">
              Write to us
            </Link>
            .
          </p>
        </Reveal>
        <Reveal delay={0.1} className="md:col-span-8">
          <FaqList />
        </Reveal>
      </div>
    </section>
  );
}
