"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Price } from "@/components/ui/primitives";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { getProductById, isPurchasable, resolvePrice } from "@/lib/product";
import { orderMessage, whatsappUrl } from "@/lib/whatsapp";

/** Mobile-only bar that appears once the main order controls scroll out of view. */
export function StickyBuyBar({ productId, watchId = "purchase" }: { productId: string; watchId?: string }) {
  const product = getProductById(productId)!;
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

  if (!isPurchasable(product)) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-ivory/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg leading-tight">
                {product.name}
                {product.pack && <span className="ml-2 font-sans text-xs text-stone">{product.pack.label}</span>}
              </p>
              <Price amount={price.amount} isPlaceholder={price.isPlaceholder} showLbp={false} className="text-sm text-stone" />
            </div>
            {needsChoice ? (
              <button
                type="button"
                className="btn btn-primary !min-h-11 !px-6"
                onClick={() => document.getElementById(watchId)?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
                Choose
              </button>
            ) : (
              <a
                href={whatsappUrl(orderMessage(product, 1))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary !min-h-11 !px-5"
              >
                <WhatsAppIcon className="h-4 w-4" /> Order
                <span className="sr-only">on WhatsApp (opens WhatsApp)</span>
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
