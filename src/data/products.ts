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
 * WhatsApp ordering, search, sitemap and structured data all read from this array.
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
    // Confirmed retail price: one box of 5 masks.
    price: { amount: 12, isPlaceholder: false },
    pack: { label: "Box of 5", units: 5, unitName: "mask" },
    availability: "in_stock",
    maxPerOrder: 10,
    // Add scents or pack sizes here once confirmed, e.g.
    // { id: "lavender", name: "Lavender", available: true }
    variants: [],
    images: [
      // Stand-in photos (isPlaceholder) cropped from supplier imagery until AURELLE photography is shot.
      // Add close-up, in-use and box-contents shots here as they become available.
      {
        id: "packaging",
        kind: "packaging",
        motif: "box",
        src: "/images/placeholders/steam-eye-mask/packaging.jpg",
        width: 1200,
        height: 1500,
        isPlaceholder: true,
        fit: "contain",
        alt: "Steam Eye Mask single-use sachet with a closed-eye illustration",
        brief: "Main packaging photograph — box front on warm ivory linen, soft daylight",
      },
      {
        id: "lifestyle",
        kind: "lifestyle",
        motif: "portrait",
        src: "/images/placeholders/steam-eye-mask/lifestyle.jpg",
        width: 1200,
        height: 1500,
        isPlaceholder: true,
        alt: "A woman relaxing against a soft knit throw while wearing the steam eye mask",
        brief: "Lifestyle — woman wearing the mask, reclined on cream bedding, natural light",
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
      contents: "Box of 5 steam eye masks",
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
