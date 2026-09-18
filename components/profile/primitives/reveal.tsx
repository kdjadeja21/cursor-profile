"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useIsClient } from "@/lib/use-is-client";

/**
 * Scroll-triggered entrance, fired once per element so scrolling back up stays calm.
 * Falls back to plain markup until hydration, which keeps the server response readable
 * without JavaScript. These sections start below the fold, so the swap is never seen.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  // Always the same element type. Swapping between `div` and `motion.div` would remount
  // the subtree at hydration, restarting every CSS animation inside it.
  const ready = useIsClient() && !reduced;

  return (
    <motion.div
      className={className}
      initial={ready ? { opacity: 0, y: 24 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
