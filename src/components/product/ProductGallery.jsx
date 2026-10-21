import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { Modal } from '../ui/index.js';
import { cn } from '../../lib/format.js';

/**
 * Product gallery: thumbnails + hover zoom on desktop, swipeable carousel on touch,
 * and a full-screen viewer with keyboard navigation.
 */
export function ProductGallery({ images, alt, focusImage }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(null);
  const [lightbox, setLightbox] = useState(false);
  const trackRef = useRef(null);

  // Jump to the variant's image when the selection changes.
  useEffect(() => {
    if (!focusImage) return;
    const i = images.indexOf(focusImage);
    if (i >= 0) goTo(i);
  }, [focusImage]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (i) => {
    const next = (i + images.length) % images.length;
    setIndex(next);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  return (
    <div className="lg:grid lg:grid-cols-[76px_1fr] lg:gap-4">
      {/* Thumbnails (desktop) */}
      <div className="hidden lg:flex lg:flex-col lg:gap-3" role="tablist" aria-label="Product images">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show image ${i + 1} of ${images.length}`}
            onClick={() => goTo(i)}
            className={cn('aspect-product w-full overflow-hidden border transition-colors', i === index ? 'border-espresso' : 'border-transparent opacity-70 hover:opacity-100')}
          >
            <img src={src} alt="" width="76" height="95" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image: carousel on touch, zoom on desktop */}
      <div className="relative">
        <div ref={trackRef} onScroll={onScroll} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto lg:overflow-hidden" aria-roledescription="carousel" aria-label={`${alt} images`}>
          {images.map((src, i) => (
            <div key={src} className="relative aspect-product w-full shrink-0 snap-center overflow-hidden bg-linen" aria-hidden={i !== index}>
              <button
                type="button"
                className="block h-full w-full cursor-zoom-in"
                onClick={() => setLightbox(true)}
                onMouseMove={onMove}
                onMouseLeave={() => setZoom(null)}
                aria-label={`Open full-screen image ${i + 1} of ${images.length}`}
                tabIndex={i === index ? 0 : -1}
              >
                <img
                  src={src}
                  alt={i === 0 ? alt : `${alt} — view ${i + 1}`}
                  width="800"
                  height="1000"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover transition-transform duration-200 ease-out"
                  style={zoom && i === index ? { transform: 'scale(1.9)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                />
              </button>
            </div>
          ))}
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1.5 bg-ivory/90 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-espresso lg:flex">
          <Expand aria-hidden className="h-3 w-3" /> Hover to zoom
        </span>
        {/* Dots (touch) */}
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5 lg:hidden">
            {images.map((src, i) => (
              <button key={src} type="button" onClick={() => goTo(i)} aria-label={`Image ${i + 1}`} aria-current={i === index} className="p-1.5">
                <span className={cn('block h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-espresso' : 'w-1.5 bg-line-strong')} />
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal open={lightbox} onClose={() => setLightbox(false)} size="xl" hideHeader className="bg-porcelain">
        <div className="relative flex items-center justify-center bg-porcelain">
          <img src={images[index]} alt={`${alt} — image ${index + 1} of ${images.length}`} className="max-h-[86vh] w-auto object-contain" />
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)} className="icon-btn absolute left-3 top-1/2 h-12 w-12 -translate-y-1/2 bg-ivory/90" aria-label="Previous image">
                <ChevronLeft className="rtl-flip h-5 w-5" strokeWidth={1.4} />
              </button>
              <button type="button" onClick={() => setIndex((i) => (i + 1) % images.length)} className="icon-btn absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 bg-ivory/90" aria-label="Next image">
                <ChevronRight className="rtl-flip h-5 w-5" strokeWidth={1.4} />
              </button>
            </>
          )}
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-ivory/90 px-3 py-1 text-[12px] tabular-nums" aria-live="polite">
            {index + 1} / {images.length}
          </p>
        </div>
      </Modal>
    </div>
  );
}
