import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // 90 is used for product & editorial photography (see EditorialImage).
    qualities: [75, 90],
    // Free-licence mood photography (see src/data/editorial.ts).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Ordering moved to WhatsApp — send any old cart/checkout links to the product.
  async redirects() {
    return ["/cart", "/checkout", "/checkout/:path*"].map((source) => ({
      source,
      destination: "/shop/steam-eye-mask",
      permanent: false,
    }));
  },
};

export default nextConfig;
