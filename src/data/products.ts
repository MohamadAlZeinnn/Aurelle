import type { Product } from "@/types/product";

/**
 * Product catalogue.
 *
 * ⚠️ BEFORE LAUNCH
 * - Set the real retail price and switch `isPlaceholder` to false.
 * - Fill every `null` in `specifications` with text taken verbatim from the
 *   manufacturer's packaging / spec sheet. `null` renders as "pending" on the
 *   site — never replace it with an assumption.
 * - Add photography: drop files in /public/images/products/steam-eye-mask/ and
 *   set each image's `src` (+ width/height). Images without `src` render as a
 *   clearly labelled placeholder.
 *
 * To add a product later, append another object — listing, product pages,
 * cart, checkout, sitemap and structured data all read from this array.
 */
export const products: Product[] = [
  {
    id: "steam-eye-mask",
    slug: "steam-eye-mask",
    brand: "AURELLE",
    name: "Steam Eye Mask",
    cardDescription:
      "An effortless self-care ritual designed to bring gentle warmth and relaxation to your everyday routine.",
    shortDescription:
      "A comforting self-care essential designed to bring warmth and relaxation into your everyday routine.",
    story: [
      "Take a moment away from the noise of everyday life.",
      "The AURELLE Steam Eye Mask transforms a simple pause into a comforting self-care ritual. Designed for moments when you need to slow down, relax, and give yourself a little time.",
    ],
    price: { amount: 15, isPlaceholder: true },
    availability: "in_stock",
    maxPerOrder: 10,
    // Add scents or pack sizes here once confirmed, e.g.
    // { id: "lavender", name: "Lavender", available: true }
    variants: [],
    images: [
      {
        id: "packaging",
        kind: "packaging",
        motif: "box",
        alt: "AURELLE Steam Eye Mask packaging",
        brief: "Main packaging photograph — box front on warm ivory linen, soft daylight",
      },
      {
        id: "closeup",
        kind: "closeup",
        motif: "mask",
        alt: "Close-up of the AURELLE Steam Eye Mask",
        brief: "Close-up of the eye mask — fabric texture, ear loops, natural shadow",
      },
      {
        id: "lifestyle",
        kind: "lifestyle",
        motif: "portrait",
        alt: "A woman relaxing while wearing the AURELLE Steam Eye Mask",
        brief: "Lifestyle — woman wearing the mask, reclined on cream bedding, natural light",
      },
      {
        id: "in-use",
        kind: "in-use",
        motif: "still",
        alt: "The AURELLE Steam Eye Mask being opened as part of an evening ritual",
        brief: "Product in use — hands opening the sachet beside a bedside ritual setting",
      },
      {
        id: "contents",
        kind: "contents",
        motif: "sachet",
        alt: "AURELLE Steam Eye Mask box and individual sachets",
        brief: "Packaging & contents — box with individual sachets laid out flat",
      },
    ],
    specifications: {
      keyFeatures: null,
      howToUse: null,
      ingredientsAndMaterials: null,
      safetyInformation: null,
      wearDuration: null,
      reusability: null,
      dailyUse: null,
      sensitiveSkin: null,
      contents: null,
    },
    active: true,
    seo: {
      title: "Steam Eye Mask",
      description:
        "The AURELLE Steam Eye Mask — a comforting self-care essential designed to bring warmth and relaxation into your everyday routine. Delivered across Lebanon.",
    },
  },
];

/** The product featured on the homepage. */
export const FEATURED_PRODUCT_ID = "steam-eye-mask";
