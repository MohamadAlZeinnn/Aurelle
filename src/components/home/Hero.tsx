"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { editorialImages } from "@/data/editorial";
import { EditorialImage } from "@/components/ui/EditorialImage";

const ease = [0.22, 1, 0.36, 1] as const;
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.2, delay, ease },
});

export function Hero() {
  const image = editorialImages.hero;
  return (
    <section aria-labelledby="hero-title" className="relative lg:grid lg:min-h-[calc(100svh-7.25rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Copy */}
      <div className="relative flex flex-col justify-center px-[var(--spacing-gutter)] pt-12 pb-14 sm:pt-16 lg:py-24 lg:pr-12 xl:pl-[max(var(--spacing-gutter),calc((100vw-var(--container-site))/2+var(--spacing-gutter)))]">
        <motion.p className="eyebrow" {...rise(0.15)}>
          The Art of Slowing Down
        </motion.p>
        <h1 id="hero-title" className="mt-7 text-display font-light">
          <motion.span className="block lg:whitespace-nowrap" {...rise(0.3)}>
            A Softer Way
          </motion.span>
          <motion.span className="block" {...rise(0.42)}>
            to <em className="font-light text-clay">Unwind.</em>
          </motion.span>
        </h1>
        <motion.p className="mt-8 max-w-[30rem] text-base leading-relaxed text-stone md:text-[1.05rem]" {...rise(0.6)}>
          Meet your new evening ritual. Discover the AURELLE Steam Eye Mask, designed to bring a moment of warmth,
          comfort, and relaxation into your everyday routine.
        </motion.p>
        <motion.div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8" {...rise(0.75)}>
          <Link href="/shop/steam-eye-mask" className="btn btn-primary">
            Discover the Eye Mask
          </Link>
          <Link href="#philosophy" className="link-line self-center sm:self-auto">
            Our Philosophy
          </Link>
        </motion.div>

        <motion.div
          className="mt-16 hidden items-center gap-4 text-[11px] tracking-[0.22em] text-stone uppercase lg:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 1.2 }}
        >
          <span className="h-px w-10 bg-taupe" aria-hidden />
          N°01 — The Evening Ritual
        </motion.div>
      </div>

      {/* Image */}
      <motion.div
        className="relative h-[68svh] min-h-[420px] sm:h-[78svh] lg:h-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease }}
        >
          <EditorialImage
            src={image.src}
            alt={image.alt}
            motif={image.motif}
            brief={image.brief} isPlaceholder={image.isPlaceholder} focus={image.focus} fit={image.fit}
            tone="plum"
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="h-full w-full"
          />
        </motion.div>
        <Link
          href="/shop/steam-eye-mask"
          className="group absolute top-5 right-5 flex items-center gap-3 bg-ivory/85 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-ivory md:top-8 md:right-8"
        >
          <span className="text-[10px] tracking-[0.22em] text-stone uppercase">Featured</span>
          <span className="font-serif text-lg leading-none">Steam Eye Mask</span>
          <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
        </Link>
      </motion.div>
    </section>
  );
}
