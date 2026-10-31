/**
 * A configurable value that has not been confirmed by the business yet.
 * Anything flagged `isPlaceholder` is shown with a visible marker and blocks
 * live (non-demo) orders until it is replaced with a real value.
 */
export interface ConfigurableAmount {
  /** Amount in USD. */
  amount: number;
  isPlaceholder: boolean;
}

export type ImageKind = "packaging" | "closeup" | "lifestyle" | "in-use" | "contents";

/** Visual motif used by the art-directed placeholder until photography is supplied. */
export type PlaceholderMotif = "portrait" | "mask" | "sachet" | "box" | "still" | "steps";

export interface ProductImage {
  id: string;
  kind: ImageKind;
  alt: string;
  /** Path under /public (e.g. "/images/products/steam-eye-mask/packaging.jpg"). Omit to render a placeholder. */
  src?: string;
  width?: number;
  height?: number;
  /** Brief for the photographer — shown on the placeholder so it is clearly marked for replacement. */
  brief: string;
  motif: PlaceholderMotif;
}

export interface ProductVariant {
  id: string;
  /** e.g. a scent name. */
  name: string;
  /** Overrides the product price when set. */
  price?: ConfigurableAmount;
  available: boolean;
}

export type Availability = "in_stock" | "out_of_stock" | "preorder";

/**
 * Manufacturer-sourced product facts. `null` means "not yet supplied" and is
 * rendered as pending — never filled in with assumed values.
 */
export interface ProductSpecifications {
  keyFeatures: string[] | null;
  howToUse: string[] | null;
  ingredientsAndMaterials: string | null;
  safetyInformation: string[] | null;
  /** Wear / warmth duration exactly as stated by the manufacturer, e.g. "about 10 minutes". */
  wearDuration: string | null;
  /** e.g. "Single use" — exactly as stated on the packaging. */
  reusability: string | null;
  dailyUse: string | null;
  sensitiveSkin: string | null;
  /** e.g. "5 masks per box". */
  contents: string | null;
}

export interface Product {
  id: string;
  slug: string;
  brand: string;
  name: string;
  /** Used in the editorial product card. */
  cardDescription: string;
  shortDescription: string;
  /** Storytelling paragraphs on the product page. */
  story: string[];
  price: ConfigurableAmount;
  availability: Availability;
  maxPerOrder: number;
  variants: ProductVariant[];
  images: ProductImage[];
  specifications: ProductSpecifications;
  /** Optional SKU / GTIN for structured data — only when real. */
  sku?: string;
  gtin?: string;
  active: boolean;
  seo: { title: string; description: string };
}
