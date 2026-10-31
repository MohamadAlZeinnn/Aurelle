import Image from "next/image";
import type { PlaceholderMotif } from "@/types/product";
import { PlaceholderArt, type PlaceholderTone } from "@/components/ui/PlaceholderArt";

interface Props {
  /** Real photograph under /public. When omitted, a labelled placeholder renders instead. */
  src?: string;
  /** `src` is a stand-in photo rather than final photography — adds a small "Placeholder image" tag. */
  isPlaceholder?: boolean;
  /** CSS object-position for the photo's focal point. */
  focus?: string;
  /** "contain" frames the photo on a backdrop rather than filling the frame. */
  fit?: "cover" | "contain";
  alt: string;
  motif: PlaceholderMotif;
  brief: string;
  tone?: PlaceholderTone;
  sizes: string;
  priority?: boolean;
  compact?: boolean;
  captionPosition?: "top" | "bottom";
  className?: string;
  imageClassName?: string;
}

/**
 * Single entry point for every editorial / product image on the site. Fills its
 * (relatively positioned, sized) parent. Swap in photography by setting `src`.
 */
export function EditorialImage({
  src,
  isPlaceholder,
  focus,
  fit = "cover",
  alt,
  motif,
  brief,
  tone,
  sizes,
  priority,
  compact,
  captionPosition,
  className = "",
  imageClassName = "",
}: Props) {
  // Callers may position the wrapper themselves (e.g. "absolute inset-0"); only default to relative otherwise.
  const position = /\b(absolute|fixed)\b/.test(className) ? "" : "relative";
  return (
    <div className={`${position} overflow-hidden bg-linen ${className}`}>
      {src ? (
        <>
          {fit === "contain" ? (
            // Framed presentation: the photo sits at a natural size on a warm backdrop.
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sand/70 to-linen p-[14%]">
              <div className="relative h-full w-full shadow-[0_24px_60px_-28px_rgba(42,28,34,0.45)]">
                <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={90} className={`object-contain ${imageClassName}`} />
              </div>
            </div>
          ) : (
            <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={90} className={`object-cover ${imageClassName}`} style={focus ? { objectPosition: focus } : undefined} />
          )}
          {isPlaceholder && !compact && (
            <span
              className={`absolute left-4 ${captionPosition === "top" ? "top-4" : "bottom-4"} bg-ivory/85 px-2 py-1 text-[9px] font-medium tracking-[0.18em] text-stone uppercase backdrop-blur-sm`}
            >
              Placeholder image
            </span>
          )}
        </>
      ) : (
        <div role="img" aria-label={`${alt} (placeholder image)`} className="absolute inset-0">
          <PlaceholderArt motif={motif} brief={brief} tone={tone} compact={compact} captionPosition={captionPosition} />
        </div>
      )}
    </div>
  );
}
