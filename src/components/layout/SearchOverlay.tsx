"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { getActiveProducts, productHref, resolvePrice, searchProducts } from "@/lib/product";
import { useDialogBehaviour } from "@/components/layout/useDialogBehaviour";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { Price } from "@/components/ui/primitives";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehaviour(open, onClose, panelRef);

  const results = query.trim() ? searchProducts(query) : getActiveProducts();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            tabIndex={-1}
            className="relative bg-ivory outline-none"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container-site py-6 md:py-10">
              <form
                role="search"
                onSubmit={(e) => e.preventDefault()}
                className="flex items-center gap-4 border-b border-ink/25 pb-3"
              >
                <Search className="h-5 w-5 shrink-0 text-stone" strokeWidth={1.25} aria-hidden />
                <label htmlFor="site-search" className="sr-only">
                  Search AURELLE
                </label>
                <input
                  id="site-search"
                  data-autofocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search rituals & essentials"
                  className="w-full bg-transparent font-serif text-2xl outline-none placeholder:text-stone/60 md:text-4xl"
                  autoComplete="off"
                />
                <button type="button" onClick={onClose} aria-label="Close search" className="p-2">
                  <X className="h-5 w-5" strokeWidth={1.25} />
                </button>
              </form>

              <div className="mt-8" aria-live="polite">
                <p className="eyebrow mb-5">{query.trim() ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Our collection"}</p>
                {results.length === 0 ? (
                  <p className="text-stone">Nothing found for “{query}”. Try “eye mask”.</p>
                ) : (
                  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((p) => {
                      const price = resolvePrice(p);
                      return (
                        <li key={p.id}>
                          <Link href={productHref(p)} onClick={onClose} className="group flex items-center gap-5">
                            <EditorialImage
                              src={p.images[0].src}
                              alt={p.images[0].alt}
                              motif={p.images[0].motif}
                              brief={p.images[0].brief}
                              sizes="96px"
                              compact
                              className="aspect-[4/5] w-20 shrink-0"
                            />
                            <div>
                              <p className="font-serif text-xl group-hover:text-clay">{p.name}</p>
                              <Price amount={price.amount} isPlaceholder={price.isPlaceholder} className="mt-1 text-sm text-stone" />
                            </div>
                            <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.25} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
