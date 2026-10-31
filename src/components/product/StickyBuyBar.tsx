"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/CartProvider";
import { Price } from "@/components/ui/primitives";
import { getProductById, isPurchasable, resolvePrice } from "@/lib/product";

/** Mobile-only bar that appears once the main purchase controls scroll out of view. */
export function StickyBuyBar({ productId, watchId = "purchase" }: { productId: string; watchId?: string }) {
  const product = getProductById(productId)!;
  const { add, isOpen } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  // Products with variants need a selection — send those customers back to the selector instead.
  const needsChoice = product.variants.length > 0;
  const price = resolvePrice(product);
  const purchasable = isPurchasable(product);

  return (
    <AnimatePresence>
      {visible && !isOpen && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-ivory/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg leading-tight">{product.name}</p>
              <Price amount={price.amount} isPlaceholder={price.isPlaceholder} showLbp={false} className="text-sm text-stone" />
            </div>
            <button
              type="button"
              className="btn btn-primary !min-h-11 !px-6"
              disabled={!purchasable}
              onClick={() =>
                needsChoice
                  ? document.getElementById(watchId)?.scrollIntoView({ behavior: "smooth", block: "center" })
                  : add(product.id, 1)
              }
            >
              {needsChoice ? "Choose" : "Add to Bag"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
