import type { Metadata } from "next";
import Link from "next/link";
import { editorialImages } from "@/data/editorial";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "AURELLE is about taking a moment for yourself — small, intentional rituals that help you slow down and restore balance.",
  alternates: { canonical: "/about" },
};

const values = [
  { title: "Simplicity", text: "Self-care that fits into real life. No complicated routines — just a few quiet minutes, done well." },
  { title: "Intention", text: "Small rituals, chosen with care. We would rather offer one thing we believe in than many we don't." },
  { title: "Honesty", text: "We describe our products plainly and never promise more than they offer." },
];

export default function AboutPage() {
  const image = editorialImages.about;
  return (
    <>
      <section className="pt-16 md:pt-24">
        <div className="container-site">
          <Reveal className="mx-auto max-w-4xl text-center">
            <p className="eyebrow">Our Story</p>
            <h1 className="mt-6 text-display font-light">
              The Art of <em>Slowing Down.</em>
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-[1.05rem] leading-relaxed text-stone">
              AURELLE represents a simple idea: taking a moment for yourself. Slowing down, restoring balance, and making
              room for small moments of self-care in everyday life.
            </p>
          </Reveal>
        </div>
        <ImageReveal className="mt-16 h-[60svh] min-h-[380px] md:mt-24 md:h-[80svh]">
          <EditorialImage src={image.src} alt={image.alt} motif={image.motif} brief={image.brief} tone="rose" sizes="100vw" className="h-full w-full" />
        </ImageReveal>
      </section>

      <section className="py-[var(--spacing-section)]">
        <div className="container-site grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <h2 className="text-headline font-light">Beauty begins with taking a moment.</h2>
          </Reveal>
          <Reveal delay={0.1} className="space-y-6 text-[1.05rem] leading-relaxed text-stone md:col-span-6 md:col-start-7">
            <p>
              At AURELLE, we believe that self-care doesn&apos;t have to be complicated. It begins with small, intentional
              moments that allow us to slow down and reconnect with ourselves.
            </p>
            <p>
              We are launching in Lebanon with a single product — the Steam Eye Mask — because we wanted to begin with one
              ritual and make it feel special: a few minutes of warmth and quiet, wherever your day takes you.
            </p>
            <p className="font-serif text-2xl leading-snug text-ink italic">
              Our philosophy is simple: make everyday rituals feel a little more special.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-linen py-[var(--spacing-section)]">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow text-center">What we value</p>
          </Reveal>
          <ul className="mt-14 grid gap-px bg-ink/10 md:grid-cols-3">
            {values.map((v, i) => (
              <li key={v.title} className="bg-linen">
                <Reveal delay={i * 0.12} className="px-2 py-10 md:px-10">
                  <span className="font-serif text-sm text-stone italic">0{i + 1}</span>
                  <h3 className="mt-6 font-serif text-3xl">{v.title}</h3>
                  <p className="mt-4 leading-relaxed text-stone">{v.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-[var(--spacing-section)] text-center">
        <Reveal className="container-site">
          <h2 className="text-headline font-light">Begin your ritual.</h2>
          <Link href="/shop/steam-eye-mask" className="btn btn-primary mt-10">
            Discover the Eye Mask
          </Link>
        </Reveal>
      </section>
    </>
  );
}
