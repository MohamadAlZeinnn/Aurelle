import { Reveal } from "@/components/ui/Reveal";

/** Consistent header for content pages (FAQ, contact, policies…). */
export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode }) {
  return (
    <section className="border-b border-ink/10 pt-16 pb-14 md:pt-24 md:pb-20">
      <div className="container-site">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-6 text-headline font-light">{title}</h1>
          {intro && <div className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-stone">{intro}</div>}
        </Reveal>
      </div>
    </section>
  );
}
