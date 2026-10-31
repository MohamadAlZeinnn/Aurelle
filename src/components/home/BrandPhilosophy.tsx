import Link from "next/link";
import { editorialImages } from "@/data/editorial";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";

export function BrandPhilosophy() {
  const image = editorialImages.philosophy;
  return (
    <section id="philosophy" aria-labelledby="philosophy-title" className="bg-linen py-[var(--spacing-section)]">
      <div className="container-site grid items-center gap-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <ImageReveal className="aspect-[4/5]">
            <EditorialImage src={image.src} alt={image.alt} motif={image.motif} brief={image.brief} isPlaceholder={image.isPlaceholder} focus={image.focus} fit={image.fit} sizes="(min-width: 768px) 40vw, 100vw" className="h-full w-full" />
          </ImageReveal>
        </div>
        <Reveal className="md:col-span-6 md:col-start-7">
          <p className="eyebrow">Our Philosophy</p>
          <h2 id="philosophy-title" className="mt-6 text-headline font-light">
            Beauty Begins With Taking a Moment.
          </h2>
          <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed text-stone">
            <p>
              At AURELLE, we believe that self-care doesn&apos;t have to be complicated. It begins with small, intentional
              moments that allow us to slow down and reconnect with ourselves.
            </p>
            <p className="font-serif text-2xl leading-snug text-ink italic">
              Our philosophy is simple: make everyday rituals feel a little more special.
            </p>
          </div>
          <Link href="/about" className="btn btn-secondary mt-12">
            Discover Our Story
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
