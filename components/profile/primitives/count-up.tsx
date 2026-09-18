"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import {
  formatCompactNumber,
  formatDuration,
  formatFullNumber,
} from "@/lib/derive";
import { cx } from "@/lib/cx";

export type CountKind = "compact" | "duration" | "integer";

/** Formatting lives here because a function prop can't cross the server boundary. */
function format(value: number, kind: CountKind): string {
  switch (kind) {
    case "compact":
      return formatCompactNumber(value);
    case "duration":
      return formatDuration(value);
    case "integer":
      return formatFullNumber(Math.round(value));
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

/**
 * Counts from zero to the value once `start` flips true, then lands with a spring
 * punch so the settled number is the moment the eye is drawn to.
 */
export function CountUp({
  amount,
  kind,
  start = true,
  delay = 0,
  duration = 1.4,
  punch = true,
  className,
}: {
  amount: number;
  kind: CountKind;
  /** Hold at zero until the scene is on screen. */
  start?: boolean;
  delay?: number;
  duration?: number;
  /** Scale flash on completion. */
  punch?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const digitsRef = useRef<HTMLSpanElement>(null);
  const [settled, setSettled] = useState(false);

  useGSAP(
    () => {
      const digits = digitsRef.current;
      if (!digits) {
        return;
      }

      if (reduced !== false || !start) {
        digits.textContent = format(reduced ? amount : 0, kind);
        return;
      }

      const proxy = { n: 0 };
      gsap.to(proxy, {
        n: amount,
        duration,
        delay,
        ease: "expo.out",
        onStart: () => {
          setSettled(false);
        },
        onUpdate: () => {
          digits.textContent = format(proxy.n, kind);
        },
        onComplete: () => {
          digits.textContent = format(amount, kind);
          setSettled(true);
          if (punch && rootRef.current) {
            gsap.fromTo(
              rootRef.current,
              { scale: 1 },
              {
                scale: 1.08,
                duration: 0.28,
                yoyo: true,
                repeat: 1,
                ease: "power2.out",
              },
            );
          }
        },
      });
    },
    { dependencies: [amount, delay, duration, kind, punch, reduced, start] },
  );

  return (
    <span ref={rootRef} className={cx("inline-block will-change-transform", className)}>
      <span ref={digitsRef} aria-hidden="true">
        {format(reduced ? amount : 0, kind)}
      </span>
      {/*
        The visible digits churn every frame, so they stay hidden from assistive tech
        and the settled value is announced exactly once instead of as a stream.
      */}
      <span className="sr-only" aria-live="polite">
        {reduced || settled ? format(amount, kind) : ""}
      </span>
    </span>
  );
}
