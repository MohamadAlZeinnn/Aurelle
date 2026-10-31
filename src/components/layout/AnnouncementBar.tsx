"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/data/site-config";
import { freeDeliveryLabel } from "@/components/ui/primitives";

function resolveMessages(): string[] {
  const threshold = freeDeliveryLabel();
  return siteConfig.announcements
    .filter((m) => threshold || !m.includes("{threshold}"))
    .map((m) => (threshold ? m.replace("{threshold}", threshold) : m));
}

export function AnnouncementBar() {
  const messages = resolveMessages();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (messages.length < 2 || paused || reduceMotion) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => window.clearInterval(id);
  }, [messages.length, paused, reduceMotion]);

  if (messages.length === 0) return null;

  return (
    <div
      className="relative z-50 flex min-h-9 items-center py-2 justify-center overflow-hidden bg-ink px-4 text-ivory"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Announcements"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={index}
          className="text-center text-[10px] leading-relaxed tracking-[0.16em] uppercase md:text-[10.5px] md:tracking-[0.22em]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
