"use client";

import { MotionConfig } from "framer-motion";
import { CartProvider } from "@/components/cart/CartProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>{children}</CartProvider>
    </MotionConfig>
  );
}
