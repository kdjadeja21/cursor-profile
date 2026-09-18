"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
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
  const [value, setValue] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (reduced) {
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
