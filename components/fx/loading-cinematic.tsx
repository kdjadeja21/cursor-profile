"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMood } from "@/lib/use-mood";
import { cx } from "@/lib/cx";

const STATUS_LINES = [
  "Counting tokens",
  "Tracing streaks",
  "Waking agents",
  "Lighting the calendar",
  "Composing the recap",
];

const LINE_MS = 1400;

/**
 * The "data loads" moment. Shared by the gate's pending state and the route-level
 * loading file so the hand-off between them is invisible.
 */
export function LoadingCinematic({
  handle,
  layoutId,
  className,
}: {
  handle?: string | null;
  /** Lets the gate morph its input pill into the orb. */
  layoutId?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [line, setLine] = useState(0);
  useMood("loading");

  useEffect(() => {
    const timer = setInterval(
      () => setLine((current) => (current + 1) % STATUS_LINES.length),
      LINE_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={handle ? `Loading @${handle}` : "Loading profile"}
      className={cx(
        "relative flex min-h-[100svh] w-full flex-col items-center justify-center px-6 text-center",
        className,
      )}
    >
      <motion.div
        layoutId={layoutId}
        className="relative flex h-[min(38vh,320px)] w-[min(38vh,320px)] items-center justify-center"
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
      >
        <div aria-hidden="true" className="absolute inset-0">
          <div className="pulse-ring border-accent/50 absolute inset-0 rounded-full border" />
          <div
            className="pulse-ring border-accent/40 absolute inset-0 rounded-full border"
            style={{ animationDelay: "0.9s" }}
          />
          <div
            className="pulse-ring border-ember/30 absolute inset-0 rounded-full border"
            style={{ animationDelay: "1.8s" }}
          />
        </div>

        <div
          aria-hidden="true"
          className="orbit absolute inset-[6%] rounded-full border border-dashed border-white/15"
        >
          <span className="bg-ember shadow-glow absolute top-[-4px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full" />
        </div>
        <div
          aria-hidden="true"
          className="orbit-reverse absolute inset-[18%] rounded-full border border-white/10"
        >
          <span className="bg-accent-soft shadow-glow absolute bottom-[-3px] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full" />
        </div>

        <div
          aria-hidden="true"
          className={cx(
            "bg-accent shadow-glow-lg relative h-[34%] w-[34%] rounded-full",
            !reduced && "breathe",
          )}
          style={{
            background:
              "radial-gradient(circle at 35% 30%, var(--color-ember), var(--color-accent) 55%, var(--color-accent-deep) 100%)",
          }}
        />
      </motion.div>

      <div className="mt-10 flex flex-col items-center gap-4">
        {handle ? (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-hero gradient-ink font-semibold"
          >
            @{handle}
          </motion.p>
        ) : null}

        <div className="text-ink-muted text-lead relative h-[1.6em] w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={line}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-x-0"
            >
              {STATUS_LINES[line]}
              <span className="text-accent">…</span>
            </motion.span>
          </AnimatePresence>
        </div>

        <div
          aria-hidden="true"
          className="shimmer shimmer-auto bg-edge relative mt-2 h-1 w-56 overflow-hidden rounded-full"
        >
          <div className="from-accent via-ember to-accent absolute inset-0 rounded-full bg-gradient-to-r opacity-70" />
        </div>
      </div>
    </div>
  );
}
