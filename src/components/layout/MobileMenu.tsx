"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { navigation, siteConfig } from "@/data/site-config";
import { useDialogBehaviour } from "@/components/layout/useDialogBehaviour";
import { InstagramIcon, TikTokIcon } from "@/components/ui/SocialIcons";

const links = [
  { label: "Shop", href: "/shop" },
  { label: "Steam Eye Mask", href: "/shop/steam-eye-mask" },
  { label: "Our Story", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const close = useCallback(() => onClose(), [onClose]);
  useDialogBehaviour(open, close, panelRef);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
          className="fixed inset-0 z-[60] flex flex-col bg-ivory outline-none md:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="container-site flex h-[4.5rem] items-center justify-between border-b border-ink/10">
            <span className="wordmark text-[1.45rem]">Aurelle</span>
            <button type="button" onClick={onClose} aria-label="Close menu" className="-mr-2 p-2">
              <X className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>
          <nav aria-label="Mobile" className="container-site flex-1 overflow-y-auto pt-10">
            <ul className="space-y-1">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={l.href} className="block py-2 font-serif text-[2.6rem] leading-tight" onClick={onClose}>
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <ul className="mt-10 space-y-3 border-t border-ink/10 pt-8 text-sm text-stone">
              {navigation.footer
                .filter((l) => !links.some((m) => m.href === l.href))
                .map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={onClose}>
                      {l.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
          <div className="container-site flex items-center justify-between border-t border-ink/10 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <p className="font-serif text-lg italic text-stone">{siteConfig.tagline}</p>
            <div className="flex gap-4">
              <a href={siteConfig.social.instagram} aria-label="AURELLE on Instagram" target="_blank" rel="noreferrer">
                <InstagramIcon />
              </a>
              <a href={siteConfig.social.tiktok} aria-label="AURELLE on TikTok" target="_blank" rel="noreferrer">
                <TikTokIcon />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
