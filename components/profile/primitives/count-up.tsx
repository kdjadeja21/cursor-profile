"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
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
 * punch and a glow flash so the settled number is the moment the eye is drawn to.
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
  /** Scale-and-glow flash on completion. */
  punch?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (reduced || !start) {
      return;
    }

    const controls = animate(0, amount, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setValue,
      onComplete: () => setSettled(true),
    });

    return () => controls.stop();
  }, [amount, delay, duration, reduced, start]);

  const shown = reduced ? amount : value;

  return (
    <motion.span
      className={cx("inline-block will-change-transform", className)}
      animate={
        punch && settled && !reduced
          ? { scale: [1, 1.08, 1], filter: ["brightness(1)", "brightness(1.6)", "brightness(1)"] }
          : undefined
      }
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <span aria-hidden="true">{format(shown, kind)}</span>
      {/*
        The visible digits churn every frame, so they stay hidden from assistive tech
        and the settled value is announced exactly once instead of as a stream.
      */}
      <span className="sr-only" aria-live="polite">
        {reduced || settled ? format(amount, kind) : ""}
      </span>
    </motion.span>
  );
}
