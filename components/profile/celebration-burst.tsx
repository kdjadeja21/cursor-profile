"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Celebration } from "@/lib/derive";
import { useScene } from "@/components/profile/scene";

/**
 * The single deliberate peak moment. Fires once per session for a milestone that was
 * actually earned — never as ambient decoration, and never on a profile with nothing
 * to celebrate.
 */
export function CelebrationBurst({
  celebration,
  handle,
}: {
  celebration: Celebration;
  handle: string;
}) {
  const reduced = useReducedMotion();
  const { ready } = useScene();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const key = `celebrated:${handle}:${celebration.headline}`;
    const seen = Boolean(sessionStorage.getItem(key));
    sessionStorage.setItem(key, "1");
    let cancelled = false;

    // Held back so the burst lands after the name has typed out rather than
    // competing with it.
    const timer = setTimeout(async () => {
      if (cancelled) {
        return;
      }

      setVisible(true);

      if (reduced || seen) {
        return;
      }

      // Loaded on demand so the bundle costs nothing on profiles with no milestone.
      const { default: confetti } = await import("canvas-confetti");
      if (cancelled) {
        return;
      }

      const shared = {
        spread: 80,
        startVelocity: 46,
        gravity: 0.85,
        ticks: 220,
        scalar: 1.2,
        colors: ["#f54e00", "#ff7a3d", "#ffb347", "#f7f5f2"],
        disableForReducedMotion: true,
      };

      confetti({ ...shared, particleCount: 90, angle: 60, origin: { x: 0.1, y: 0.6 } });
      confetti({ ...shared, particleCount: 90, angle: 120, origin: { x: 0.9, y: 0.6 } });
      setTimeout(() => {
        confetti({ ...shared, particleCount: 60, origin: { x: 0.5, y: 0.3 } });
      }, 350);
    }, 1900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [celebration.headline, handle, ready, reduced]);

  if (!visible) {
    return null;
  }

  return (
    <motion.div
      role="status"
      initial={reduced ? false : { opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="glass shimmer shimmer-auto border-accent/50 shadow-glow mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 overflow-hidden rounded-full px-5 py-3 sm:mt-10 sm:px-7 sm:py-4"
    >
      <span aria-hidden="true" className="text-2xl">
        ✦
      </span>
      <span className="text-accent text-title font-semibold">{celebration.headline}</span>
      <span className="text-ink-muted text-base">{celebration.detail}</span>
    </motion.div>
  );
}
