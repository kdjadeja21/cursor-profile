"use client";

import { motion, useReducedMotion } from "motion/react";
import { useIsClient } from "@/lib/use-is-client";
import { cx } from "@/lib/cx";

/**
 * Staggered blur-and-rise reveal, one unit (word or character) at a time. The server
 * renders the text fully visible; the hidden start state only applies after hydration,
 * so a no-JS response and the reduced-motion path both read as plain text.
 */
export function SplitText({
  text,
  by = "chars",
  start = true,
  delay = 0,
  stagger,
  duration = 0.7,
  className,
  unitClassName,
  caret = false,
}: {
  text: string;
  by?: "chars" | "words";
  /** Hold the reveal until the scene is in view. */
  start?: boolean;
  delay?: number;
  stagger?: number;
  duration?: number;
  className?: string;
  unitClassName?: string;
  /** Finish with the blinking brand caret. */
  caret?: boolean;
}) {
  const reduced = useReducedMotion();
  const animated = useIsClient() && !reduced;

  const units = by === "words" ? text.split(/(\s+)/) : Array.from(text);
  const step = stagger ?? (by === "words" ? 0.08 : 0.035);
  const total = delay + units.length * step + duration;

  return (
    <span className={cx("inline-block", className)}>
      <span className="sr-only">{text}</span>
      {units.map((unit, index) => {
        if (/^\s+$/.test(unit)) {
          return (
            <span key={index} aria-hidden="true">
              {unit}
            </span>
          );
        }

        return (
          <motion.span
            key={index}
            aria-hidden="true"
            className={cx("inline-block will-change-transform", unitClassName)}
            initial={animated ? { opacity: 0, y: "0.6em", filter: "blur(12px)", scale: 0.9 } : false}
            animate={
              animated && !start
                ? undefined
                : { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }
            }
            transition={{
              duration,
              delay: delay + index * step,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {unit === " " ? "\u00A0" : unit}
          </motion.span>
        );
      })}
      {caret && !reduced ? (
        <motion.span
          aria-hidden="true"
          className="ml-[0.08em] inline-block h-[0.82em] w-[0.07em] translate-y-[0.06em] align-baseline"
          initial={animated ? { opacity: 0 } : false}
          animate={animated && !start ? undefined : { opacity: 1 }}
          transition={{ duration: 0.2, delay: total - duration * 0.6 }}
        >
          <span className="caret-blink bg-accent shadow-glow block h-full w-full rounded-sm" />
        </motion.span>
      ) : null}
    </span>
  );
}
