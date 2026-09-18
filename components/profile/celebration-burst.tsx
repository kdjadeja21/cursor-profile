"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { Celebration } from "@/lib/derive";

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `celebrated:${handle}:${celebration.headline}`;
    if (sessionStorage.getItem(key)) {
      return;
    }

    sessionStorage.setItem(key, "1");
    let cancelled = false;

    // Held back so the burst lands after the entry sequence has settled rather than
    // competing with it.
    const timer = setTimeout(async () => {
      if (cancelled) {
        return;
      }

      setVisible(true);

      if (reduced) {
        return;
      }

      // Loaded on demand so the bundle costs nothing on profiles with no milestone.
      const { default: confetti } = await import("canvas-confetti");
      if (cancelled) {
        return;
      }

      const shared = {
        spread: 70,
        startVelocity: 38,
        gravity: 0.9,
        ticks: 180,
        colors: ["#f54e00", "#ff7a3d", "#eab308", "#f5f5f4"],
        disableForReducedMotion: true,
      };

      confetti({ ...shared, particleCount: 70, origin: { x: 0.2, y: 0.35 } });
      confetti({ ...shared, particleCount: 70, origin: { x: 0.8, y: 0.35 } });
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [celebration.headline, handle, reduced]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      className="border-accent/40 bg-accent/10 mt-8 flex animate-[rise-in_0.6s_cubic-bezier(0.22,1,0.36,1)] flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border px-5 py-4"
    >
      <span className="text-accent text-title">{celebration.headline}</span>
      <span className="text-ink-muted text-small">{celebration.detail}</span>
    </div>
  );
}
