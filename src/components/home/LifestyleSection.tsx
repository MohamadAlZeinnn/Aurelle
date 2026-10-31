import Link from "next/link";
import { editorialImages } from "@/data/editorial";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";

export function LifestyleSection() {
  const { lifestyle, lifestyleDetail } = editorialImages;
  return (
    <section aria-labelledby="lifestyle-title" className="relative">
      <ImageReveal className="h-[78svh] min-h-[480px] w-full md:h-[92svh]">
        <EditorialImage
          src={lifestyle.src}
          alt={lifestyle.alt}
          motif={lifestyle.motif}
          brief={lifestyle.brief}
          tone="sand"
          sizes="100vw"
          captionPosition="top"
          className="h-full w-full"
        />
      </ImageReveal>

      <div className="container-site relative">
        <div className="relative -mt-28 grid gap-10 md:-mt-48 md:grid-cols-12">
          <Reveal className="bg-ivory p-8 sm:p-12 md:col-span-7 md:p-16 lg:col-span-6">
            <p className="eyebrow">An everyday pause</p>
            <h2 id="lifestyle-title" className="mt-6 text-headline font-light">
              Make Room for a <em>Moment of You.</em>
            </h2>
            <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-stone">
              Between the busy mornings and endless to-do lists, there is always room for a little pause.
            </p>
            <Link href="/shop/steam-eye-mask" className="link-line mt-10">
              Begin Your Ritual
            </Link>
          </Reveal>
          <Reveal delay={0.2} className="hidden md:col-span-4 md:col-start-9 md:block md:self-end lg:col-span-3 lg:col-start-10">
            <div className="relative aspect-[3/4]">
              <EditorialImage
                src={lifestyleDetail.src}
                alt={lifestyleDetail.alt}
                motif={lifestyleDetail.motif}
                brief={lifestyleDetail.brief}
                compact
                sizes="25vw"
                className="absolute inset-0"
              />
            </div>
            <p className="mt-4 font-serif text-lg italic text-stone">Warmth, softly.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
