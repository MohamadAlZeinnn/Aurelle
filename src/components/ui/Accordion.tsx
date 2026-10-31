"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Props {
  items: AccordionItem[];
  /** Ids open on first render. */
  defaultOpen?: string[];
  /** Larger serif titles (FAQ) vs. compact uppercase titles (product details). */
  variant?: "serif" | "compact";
}

export function Accordion({ items, defaultOpen = [], variant = "serif" }: Props) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const baseId = useId();
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  return (
    <div className="border-t border-ink/12">
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const buttonId = `${baseId}-${item.id}-btn`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id} className="border-b border-ink/12">
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={`group flex w-full items-center justify-between gap-6 text-left transition-colors ${
                  variant === "serif"
                    ? "py-6 font-serif text-xl md:text-2xl"
                    : "py-5 font-sans text-[0.75rem] font-medium uppercase tracking-[0.18em]"
                }`}
              >
                <span className="group-hover:text-clay transition-colors duration-300">{item.title}</span>
                <span aria-hidden className="relative h-3 w-3 shrink-0">
                  <span className="absolute left-0 top-1/2 h-px w-3 bg-ink" />
                  <span
                    className={`absolute left-0 top-1/2 h-px w-3 bg-ink transition-transform duration-500 ease-[var(--ease-soft)] ${
                      isOpen ? "rotate-0" : "rotate-90"
                    }`}
                  />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="max-w-2xl pb-7 text-[0.95rem] leading-relaxed text-stone">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
