import type { PlaceholderMotif } from "@/types/product";

/**
 * Editorial (non-product) imagery. `src` is a file under /public or an
 * images.unsplash.com URL; without `src`, an illustrated placeholder renders.
 *
 * Mood photography is from Unsplash under the free Unsplash License
 * (commercial use, no attribution required — credited here for reference).
 * It deliberately shows no competing products; the product itself only
 * appears in AURELLE's own imagery.
 */
export interface EditorialAsset {
  src?: string;
  /** `src` is a stand-in photo, not final photography — shown with a tag. */
  isPlaceholder?: boolean;
  /** CSS object-position for the photo's focal point, e.g. "60% 35%". */
  focus?: string;
  fit?: "cover" | "contain";
  alt: string;
  brief: string;
  motif: PlaceholderMotif;
}

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2400&q=85`;

export const editorialImages: Record<"hero" | "lifestyle" | "lifestyleDetail" | "philosophy" | "about", EditorialAsset> = {
  hero: {
    // unsplash.com — "A woman laying on a couch with her eyes closed"
    src: unsplash("photo-1720084026217-aa7e5bd2cdda"),
    focus: "62% 30%",
    alt: "A woman resting with her eyes closed in warm light filtering through linen curtains",
    brief: "Hero — woman unwinding with the steam eye mask at dusk, warm lamplight, deep plum & cocoa tones, cream linen, natural skin texture",
    motif: "ritual",
  },
  lifestyle: {
    // unsplash.com/@anamarkovych — "a window sill filled with books and candles"
    src: unsplash("photo-1632900182533-c8ee9ba229f4"),
    focus: "50% 70%",
    alt: "Candles glowing on an evening window sill beside a stack of books",
    brief: "Lifestyle — quiet evening corner, candlelight, the mask sachet set down mid-ritual",
    motif: "still",
  },
  lifestyleDetail: {
    // unsplash.com — "a person lighting a candle on a table"
    src: unsplash("photo-1707355274813-633939fbc8e0"),
    alt: "A hand lighting a small candle",
    brief: "Detail — lighting a candle to begin the evening ritual",
    motif: "mask",
  },
  philosophy: {
    src: "/images/placeholders/steam-eye-mask/packaging.jpg",
    isPlaceholder: true,
    fit: "contain",
    alt: "Steam Eye Mask single-use sachet with a closed-eye illustration",
    brief: "Brand — packaging on warm travertine, long soft shadows",
    motif: "box",
  },
  about: {
    // unsplash.com — "Woman with eyes closed in warm, soft light"
    src: unsplash("photo-1767439566981-bd8949a5b574"),
    focus: "50% 25%",
    alt: "A woman with her eyes closed in warm, soft evening light",
    brief: "Our Story — a quiet evening pause, warm lamplight in a minimal interior",
    motif: "ritual",
  },
};
