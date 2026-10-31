import type { ConfigurableAmount } from "@/types/product";

/**
 * Store-wide configuration. Every value here is safe to edit without touching
 * components. Items marked `isPlaceholder` show a visible marker and block live
 * orders until confirmed.
 */
export const siteConfig = {
  name: "AURELLE",
  tagline: "The Art of Slowing Down.",
  description:
    "Discover AURELLE Steam Eye Mask — a simple, comforting self-care ritual designed to bring warmth and relaxation into your everyday routine.",
  defaultTitle: "AURELLE | Premium Skincare & Self-Care in Lebanon",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_LB",
  market: "Lebanon",

  /** Rotating messages in the announcement bar. `{threshold}` is replaced with the free-delivery threshold. */
  announcements: [
    "A little moment of calm, delivered to your door.",
    "Complimentary delivery across Lebanon on orders above {threshold}.",
    "Discover your new self-care ritual.",
  ],

  currency: {
    primary: "USD" as const,
    /**
     * Optional LBP display. Set to the rate you want to show (LBP per 1 USD),
     * e.g. 89500. `null` hides LBP entirely. LBP is shown as an indication
     * only — orders are always priced in USD.
     */
    lbpRate: null as number | null,
  },

  shipping: {
    countries: ["Lebanon"],
    deliveryFee: { amount: 4, isPlaceholder: true } as ConfigurableAmount,
    /** Orders at or above this subtotal ship free. `null` disables free delivery. */
    freeDeliveryThreshold: { amount: 50, isPlaceholder: true } as ConfigurableAmount | null,
    /** Shown on product page, cart and FAQ. `null` renders as pending. */
    deliveryEstimate: null as string | null,
    returnsWindowDays: null as number | null,
  },

  payments: {
    /** Cash on Delivery. */
    cashOnDelivery: true,
  },

  /**
   * All orders are placed on WhatsApp: "Order" buttons open a chat with a
   * pre-filled message (product, quantity) — there is no cart or checkout.
   */
  ordering: {
    whatsapp: "+96176831948",
    /** Shown as the display version of the number. */
    whatsappDisplay: "+961 76 831 948",
  },

  contact: {
    email: "hello@aurelle.example" as string,
    /** Applies to `email` only — the WhatsApp number above is confirmed. */
    isPlaceholder: true,
    hours: null as string | null,
  },

  social: {
    instagram: "https://instagram.com/" as string,
    tiktok: "https://tiktok.com/" as string,
  },
};

export const navigation = {
  primary: [
    { label: "Shop", href: "/shop" },
    { label: "Our Story", href: "/about" },
  ],
  footer: [
    { label: "Shop", href: "/shop" },
    { label: "Our Story", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Shipping & Returns", href: "/shipping-returns" },
  ],
  policies: [
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Terms & Conditions", href: "/policies/terms" },
    { label: "Refund Policy", href: "/policies/refund" },
  ],
};
