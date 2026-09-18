"use client";

import { Fragment, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useIsClient } from "@/lib/use-is-client";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

/**
 * Staggered rise reveal, one unit (word or character) at a time. The server
 * renders the text fully visible; the hidden start state only applies after
 * hydration, so a no-JS response and the reduced-motion path both read as plain
 * text.
 *
 * Characters are grouped per word so line breaks only ever fall on spaces.
 * Transforms stay on translate/opacity — no blur or per-glyph background-clip,
 * which were clipping descenders and thrashing the GPU.
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
  const animated = useIsClient() && reduced === false;
  const rootRef = useRef<HTMLSpanElement>(null);

  const words = text.split(/\s+/).filter(Boolean);
  const step = stagger ?? (by === "words" ? 0.08 : 0.028);
  const unitCount =
    by === "words" ? words.length : Array.from(text.replace(/\s+/g, "")).length;
  const total = delay + unitCount * step + duration;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !animated) {
        return;
      }

      const units = root.querySelectorAll<HTMLElement>("[data-split-unit]");
      const caretNode = root.querySelector<HTMLElement>("[data-split-caret]");

      if (!start) {
        gsap.set(units, { y: "0.4em", opacity: 0 });
        if (caretNode) {
          gsap.set(caretNode, { opacity: 0 });
        }
        return;
      }

      gsap.fromTo(
        units,
        { y: "0.4em", opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          delay,
          stagger: step,
          ease: "expo.out",
          overwrite: "auto",
          force3D: false,
        },
      );

      if (caretNode) {
        gsap.fromTo(
          caretNode,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.2,
            delay: Math.max(0, total - duration * 0.6),
            overwrite: "auto",
          },
        );
      }
    },
    { scope: rootRef, dependencies: [animated, start, text, delay, duration, step, total] },
  );

  return (
    <span
      ref={rootRef}
      className={cx("inline-block overflow-visible text-balance", className)}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, wordIndex) => {
        const units = by === "words" ? [word] : Array.from(word);

        return (
          <Fragment key={wordIndex}>
            <span
              aria-hidden="true"
              className="inline-block overflow-visible whitespace-nowrap"
            >
              {units.map((unit, index) => (
                <span
                  key={index}
                  data-split-unit=""
                  className={cx(
                    "inline-block overflow-visible py-[0.14em] will-change-transform",
                    unitClassName,
                  )}
                >
                  {unit}
                </span>
              ))}
            </span>
            {wordIndex < words.length - 1 ? <span aria-hidden="true"> </span> : null}
          </Fragment>
        );
      })}
      {caret && reduced !== true ? (
        <span
          aria-hidden="true"
          data-split-caret=""
          className="ml-[0.08em] inline-block h-[0.82em] w-[0.07em] translate-y-[0.06em] align-baseline"
        >
          <span className="caret-blink bg-accent shadow-glow block h-full w-full rounded-sm" />
        </span>
      ) : null}
    </span>
  );
}
