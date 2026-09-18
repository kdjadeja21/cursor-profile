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

/** Pause after the camera has settled, so each section can actually be read. */
const DWELL_MS: Record<(typeof STOPS)[number], number> = {
  hero: 3800,
  constellation: 4200,
  momentum: 3400,
  tokens: 4000,
  agents: 3400,
  milestones: 3200,
  share: 800,
};

const SCROLL_MIN_MS = 1600;
const SCROLL_MAX_MS = 2800;
const SCROLL_MS_PER_PX = 1.15;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

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

function targetTop(id: string): number | null {
  const node = document.getElementById(id);
  if (!node) {
    return null;
  }

  const styles = getComputedStyle(node);
  const margin = Number.parseFloat(styles.scrollMarginTop) || 0;
  const maxY = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );

  return Math.min(maxY, Math.max(0, window.scrollY + node.getBoundingClientRect().top - margin));
}

/**
 * Browser `behavior: "smooth"` caps out around half a second regardless of
 * distance, which is why the recap felt like it was snapping. This eases the
 * camera over a duration that scales with how far it has to travel.
 */
function scrollToY(
  targetY: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    const startY = window.scrollY;
    const delta = targetY - startY;

    if (Math.abs(delta) < 2) {
      resolve();
      return;
    }

    const duration = Math.min(
      SCROLL_MAX_MS,
      Math.max(SCROLL_MIN_MS, Math.abs(delta) * SCROLL_MS_PER_PX),
    );
    const started = performance.now();

    const step = (now: number) => {
      if (signal.aborted) {
        resolve();
        return;
      }

      const t = Math.min(1, (now - started) / duration);
      window.scrollTo({ top: startY + delta * easeInOutCubic(t), behavior: "auto" });

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
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
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    // `html { scroll-behavior: smooth }` would fight the rAF tween and snap it.
    root.style.scrollBehavior = "auto";

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

        const top = targetTop(stop);
        if (top !== null) {
          await scrollToY(top, signal);
        }

        if (signal.aborted) {
          return;
        }

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
      root.style.scrollBehavior = previousBehavior;
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
