"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductImage } from "@/types/product";
import { EditorialImage } from "@/components/ui/EditorialImage";

const TONES = ["sand", "ivory", "rose", "ivory", "sand"] as const;

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    setActive(i);
    trackRef.current?.scrollTo({ left: i * (trackRef.current?.clientWidth ?? 0), behavior: "smooth" });
  };

  const current = images[active];

  return (
    <div aria-roledescription="carousel" aria-label={`${productName} images`}>
      {/* Mobile / tablet: swipeable track */}
      <div className="lg:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          tabIndex={0}
          aria-label="Swipe to see more images"
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative aspect-[4/5] w-full shrink-0 snap-center sm:aspect-square"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
            >
              <EditorialImage
                src={img.src}
                alt={img.alt}
                motif={img.motif}
                brief={img.brief} isPlaceholder={img.isPlaceholder} focus={img.focus} fit={img.fit}
                tone={TONES[i % TONES.length]}
                priority={i === 0}
                sizes="100vw"
                className="absolute inset-0"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={active === i}
              className="flex h-6 items-center"
            >
              <span className={`block h-px transition-all duration-500 ${active === i ? "w-8 bg-ink" : "w-4 bg-ink/25"}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: thumbnail rail + main stage */}
      <div className="hidden gap-5 lg:grid lg:grid-cols-[5.5rem_minmax(0,1fr)]">
        <ul className="flex flex-col gap-3">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show ${img.alt}`}
                aria-current={active === i}
                className={`relative block aspect-[4/5] w-full transition-opacity duration-500 ${
                  active === i ? "opacity-100 ring-1 ring-ink ring-offset-2 ring-offset-ivory" : "opacity-60 hover:opacity-100"
                }`}
              >
                <EditorialImage src={img.src} alt="" motif={img.motif} brief={img.brief} isPlaceholder={img.isPlaceholder} focus={img.focus} fit={img.fit} tone={TONES[i % TONES.length]} compact sizes="88px" className="absolute inset-0" />
              </button>
            </li>
          ))}
        </ul>
        <div className="relative aspect-[4/5] overflow-hidden bg-linen">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <EditorialImage
                src={current.src}
                alt={current.alt}
                motif={current.motif}
                brief={current.brief} isPlaceholder={current.isPlaceholder} focus={current.focus} fit={current.fit}
                tone={TONES[active % TONES.length]}
                priority={active === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="absolute inset-0"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
