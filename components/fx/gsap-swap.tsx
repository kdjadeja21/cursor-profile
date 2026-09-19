"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

/**
 * Fades replacement content in when `id` changes. Replaces Motion's
 * AnimatePresence wait-mode for captions, errors, and readouts.
 */
export function GsapSwap({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const node = ref.current;
      if (!node || reduced !== false) {
        return;
      }

      gsap.fromTo(
        node,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" },
      );
    },
    { dependencies: [id, reduced] },
  );

  return (
    <div ref={ref} className={cx("overflow-visible will-change-transform", className)}>
      {children}
    </div>
  );
}
