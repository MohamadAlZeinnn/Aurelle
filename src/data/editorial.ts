import type { PlaceholderMotif } from "@/types/product";

/**
 * Editorial (non-product) imagery. Set `src` to a file under /public to replace
 * a placeholder with real photography.
 */
export interface EditorialAsset {
  src?: string;
  alt: string;
  brief: string;
  motif: PlaceholderMotif;
}

export const editorialImages: Record<"hero" | "lifestyle" | "lifestyleDetail" | "philosophy" | "about", EditorialAsset> = {
  hero: {
    alt: "A woman resting against cream linen pillows wearing the AURELLE Steam Eye Mask in soft evening light",
    brief: "Hero — woman relaxing with the steam eye mask, cream & beige bedroom, soft natural window light, natural skin texture",
    motif: "portrait",
  },
  lifestyle: {
    alt: "A calm, sunlit bedside corner with linen and the AURELLE Steam Eye Mask",
    brief: "Lifestyle — quiet sunlit bedside, linen, a cup of tea, the mask sachet set down mid-ritual",
    motif: "still",
  },
  lifestyleDetail: {
    alt: "Close detail of the AURELLE Steam Eye Mask resting on linen",
    brief: "Detail — the mask resting on rumpled linen, raking light",
    motif: "mask",
  },
  philosophy: {
    alt: "AURELLE packaging styled on a warm stone surface",
    brief: "Brand — packaging on warm travertine, long soft shadows",
    motif: "box",
  },
  about: {
    alt: "A moment of rest in a warm, minimal room",
    brief: "Our Story — portrait of a quiet pause, warm minimal interior",
    motif: "portrait",
  },
};
