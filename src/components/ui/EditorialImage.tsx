import Image from "next/image";
import type { PlaceholderMotif } from "@/types/product";
import { PlaceholderArt, type PlaceholderTone } from "@/components/ui/PlaceholderArt";

interface Props {
  /** Real photograph under /public. When omitted, a labelled placeholder renders instead. */
  src?: string;
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
export function EditorialImage({ src, alt, motif, brief, tone, sizes, priority, compact, captionPosition, className = "", imageClassName = "" }: Props) {
  // Callers may position the wrapper themselves (e.g. "absolute inset-0"); only default to relative otherwise.
  const position = /\b(absolute|fixed)\b/.test(className) ? "" : "relative";
  return (
    <div className={`${position} overflow-hidden bg-linen ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${imageClassName}`} />
      ) : (
        <div role="img" aria-label={`${alt} (placeholder image)`} className="absolute inset-0">
          <PlaceholderArt motif={motif} brief={brief} tone={tone} compact={compact} captionPosition={captionPosition} />
        </div>
      )}
    </div>
  );
}
