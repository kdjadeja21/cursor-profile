"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const STOPS = [
  "hero",
  "constellation",
  "momentum",
  "tokens",
  "agents",
  "milestones",
  "share",
] as const;

/** Dwell long enough for each section's own entrance (wave, draw-in, count-up) to land. */
const DWELL_MS: Record<(typeof STOPS)[number], number> = {
  hero: 3200,
  constellation: 3600,
  momentum: 2800,
  tokens: 3400,
  agents: 2800,
  milestones: 2600,
  share: 0,
};

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Plays the page as a paced recap so the visitor doesn't have to scroll.
 * Any wheel, touch, paging key, or the take-over control hands control back
 * immediately — the journey is a default, not a trap.
 */
export function JourneyScroller() {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // null on the first render, before the media query is known.
    if (reduced !== false) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const handOver = () => {
      if (signal.aborted) {
        return;
      }

      controller.abort();
      setPlaying(false);
    };

    window.addEventListener("wheel", handOver, { passive: true, signal });
    window.addEventListener("touchstart", handOver, { passive: true, signal });
    window.addEventListener(
      "keydown",
      (event) => {
        if (
          ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(
            event.key,
          )
        ) {
          handOver();
        }
      },
      { signal },
    );

    const run = async () => {
      setPlaying(true);

      for (const stop of STOPS) {
        if (signal.aborted) {
          return;
        }

        document
          .getElementById(stop)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });

        const dwell = DWELL_MS[stop];
        if (dwell > 0) {
          await wait(dwell, signal);
        }
      }

      if (!signal.aborted) {
        setPlaying(false);
      }
    };

    void run();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [reduced]);

  if (!playing) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <button
        type="button"
        onClick={() => {
          abortRef.current?.abort();
          setPlaying(false);
        }}
        className="border-edge bg-surface/90 text-ink-muted hover:text-ink focus-visible:ring-ink text-micro rounded-full border px-4 py-2 tracking-[0.16em] uppercase backdrop-blur outline-none focus-visible:ring-2"
      >
        Playing the recap · click or scroll to take over
      </button>
    </div>
  );
}
