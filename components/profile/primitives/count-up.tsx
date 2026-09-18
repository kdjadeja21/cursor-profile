"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  formatCompactNumber,
  formatDuration,
  formatFullNumber,
} from "@/lib/derive";

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

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function CountUp({
  amount,
  kind,
  delay = 0,
  duration = 1.4,
}: {
  amount: number;
  kind: CountKind;
  delay?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  // Start on the real total so a skipped animation (no JS, reduced motion, or a
  // trillion-scale value that a generic interpolator refuses) never paints "0".
  const [value, setValue] = useState(amount);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (reduced) {
      return;
    }

    let frame = 0;
    let origin = 0;
    const delayMs = delay * 1000;
    const durationMs = duration * 1000;

    const tick = (now: number) => {
      if (!origin) {
        origin = now;
      }

      const elapsed = now - origin - delayMs;
      if (elapsed <= 0) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(1, elapsed / durationMs);
      setValue(amount * easeOutCubic(progress));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }

      setValue(amount);
      setSettled(true);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [amount, delay, duration, reduced]);

  return (
    <>
      <span aria-hidden="true">{format(reduced ? amount : value, kind)}</span>
      {/*
        The visible digits churn every frame, so they stay hidden from assistive tech
        and the settled value is announced exactly once instead of as a stream.
      */}
      <span className="sr-only" aria-live="polite">
        {reduced || settled ? format(amount, kind) : ""}
      </span>
    </>
  );
}
