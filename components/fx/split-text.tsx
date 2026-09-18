"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useIsClient } from "@/lib/use-is-client";
import { cx } from "@/lib/cx";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Staggered blur-and-rise reveal, one unit (word or character) at a time. The server
 * renders the text fully visible; the hidden start state only applies after hydration,
 * so a no-JS response and the reduced-motion path both read as plain text.
 *
 * Characters are grouped per word so line breaks only ever fall on spaces.
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

  const words = text.split(/\s+/).filter(Boolean);
  const step = stagger ?? (by === "words" ? 0.08 : 0.035);
  const unitCount = by === "words" ? words.length : Array.from(text.replace(/\s+/g, "")).length;
  const total = delay + unitCount * step + duration;

  const hidden = { opacity: 0, y: "0.6em", filter: "blur(12px)", scale: 0.9 };
  const shown = { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 };

  let unitIndex = 0;

  return (
    <span className={cx("inline-block text-balance", className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, wordIndex) => {
        const units = by === "words" ? [word] : Array.from(word);

        return (
          <Fragment key={wordIndex}>
            <span aria-hidden="true" className="inline-block whitespace-nowrap">
              {units.map((unit, index) => {
                const order = unitIndex;
                unitIndex += 1;

                return (
                  <motion.span
                    key={index}
                    className={cx("inline-block will-change-transform", unitClassName)}
                    initial={animated ? hidden : false}
                    animate={animated && !start ? undefined : shown}
                    transition={{ duration, delay: delay + order * step, ease: EASE }}
                  >
                    {unit}
                  </motion.span>
                );
              })}
            </span>
            {wordIndex < words.length - 1 ? <span aria-hidden="true"> </span> : null}
          </Fragment>
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
