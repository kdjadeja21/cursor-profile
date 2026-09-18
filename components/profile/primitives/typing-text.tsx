"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useIsClient } from "@/lib/use-is-client";

/**
 * Types the headline out behind a blinking caret. Cursor is literally a text cursor,
 * so this reads as brand rather than as a generic terminal effect.
 */
export function TypingText({
  text,
  className,
  speed = 45,
  delay = 260,
}: {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  // The name is the largest text on the page, so the server renders it in full rather
  // than shipping an empty heading and typing it in only once hydration lands.
  const animating = useIsClient() && !reduced;
  const [typed, setTyped] = useState(0);
  const characters = Array.from(text);

  useEffect(() => {
    if (reduced) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    let count = 0;

    const tick = () => {
      count += 1;
      setTyped(count);

      if (count < characters.length) {
        timer = setTimeout(tick, speed);
      }
    };

    const start = setTimeout(tick, delay);

    return () => {
      clearTimeout(start);
      clearTimeout(timer);
    };
  }, [characters.length, speed, delay, reduced, text]);

  const visible = animating
    ? Math.min(typed, characters.length)
    : characters.length;
  const done = visible >= characters.length;

  return (
    <span className={className}>
      <span aria-hidden="true">{characters.slice(0, visible).join("")}</span>
      <span className="sr-only">{text}</span>
      {/* A frozen caret would just read as a stray mark once the blink is suppressed. */}
      {reduced ? null : (
        <span
          aria-hidden="true"
          className={`bg-accent ml-1 inline-block h-[0.8em] w-[0.08em] translate-y-[0.04em] align-baseline ${done ? "caret-blink" : ""}`}
        />
      )}
    </span>
  );
}
