"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

/** Scale-X fill from the left. Used for progress bars and share meters. */
export function GsapFill({
  play,
  duration = 1.2,
  delay = 0,
  ease = "power3.out",
  className,
  style,
}: {
  play: boolean;
  duration?: number;
  delay?: number;
  ease?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) {
        return;
      }

      gsap.set(node, { transformOrigin: "left center" });

      if (reduced !== false) {
        gsap.set(node, { scaleX: reduced ? 1 : 0 });
        return;
      }

      if (!play) {
        gsap.set(node, { scaleX: 0 });
        return;
      }

      gsap.fromTo(
        node,
        { scaleX: 0 },
        { scaleX: 1, duration, delay, ease },
      );
    },
    { dependencies: [play, duration, delay, ease, reduced] },
  );

  return <div ref={ref} className={cx("origin-left", className)} style={style} />;
}
