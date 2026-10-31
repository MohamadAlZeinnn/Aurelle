"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary, FreeDeliveryProgress } from "@/components/cart/CartSummary";
import { useDialogBehaviour } from "@/components/layout/useDialogBehaviour";

export function CartDrawer() {
  const { isOpen, close, priced, totals, count } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useDialogBehaviour(isOpen, close, panelRef);

  // Close on route change.
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={close}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-full max-w-[28rem] flex-col bg-ivory shadow-[0_0_60px_rgba(41,40,36,0.08)] outline-none"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5 sm:px-8">
              <h2 className="font-serif text-2xl">
                Your Bag <span className="font-sans text-sm text-stone">({count})</span>
              </h2>
              <button type="button" onClick={close} aria-label="Close bag" className="-mr-2 p-2 hover:text-clay">
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </header>

            {priced.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <p className="eyebrow mb-4">Your bag is empty</p>
                <p className="max-w-[18rem] font-serif text-3xl leading-tight">A little moment of calm is waiting for you.</p>
                <Link href="/shop/steam-eye-mask" className="btn btn-primary mt-10" onClick={close}>
                  Discover the Eye Mask
                </Link>
              </div>
            ) : (
              <>
                <div className="px-6 pt-5 sm:px-8">
                  <FreeDeliveryProgress subtotal={totals.subtotal} />
                </div>
                <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6 sm:px-8">
                  {priced.map((line) => (
                    <CartItem key={`${line.productId}-${line.variantId ?? ""}`} line={line} onNavigate={close} />
                  ))}
                </ul>
                <footer className="border-t border-ink/10 bg-linen/50 px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
                  <CartSummary totals={totals} compact />
                  <Link href="/checkout" className="btn btn-primary mt-6 w-full" onClick={close}>
                    Proceed to Checkout
                  </Link>
                  <Link href="/cart" onClick={close} className="mt-4 block text-center text-xs tracking-[0.14em] text-stone uppercase hover:text-ink">
                    View full bag
                  </Link>
                </footer>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
