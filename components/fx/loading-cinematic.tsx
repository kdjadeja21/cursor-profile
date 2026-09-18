"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { GsapSwap } from "@/components/fx/gsap-swap";
import { useMood } from "@/lib/use-mood";
import { useReducedMotion } from "@/lib/use-reduced-motion";
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
  className,
}: {
  handle?: string | null;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLParagraphElement>(null);
  const [line, setLine] = useState(0);
  useMood("loading");

  useEffect(() => {
    const timer = setInterval(
      () => setLine((current) => (current + 1) % STATUS_LINES.length),
      LINE_MS,
    );
    return () => clearInterval(timer);
  }, []);

  useGSAP(
    () => {
      if (reduced !== false) {
        return;
      }

      if (orbRef.current) {
        gsap.fromTo(
          orbRef.current,
          { opacity: 0, scale: 0.82 },
          { opacity: 1, scale: 1, duration: 0.85, ease: "expo.out" },
        );
      }

      if (handleRef.current) {
        gsap.fromTo(
          handleRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: "expo.out" },
        );
      }
    },
    { scope: rootRef, dependencies: [reduced, handle] },
  );

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label={handle ? `Loading @${handle}` : "Loading profile"}
      className={cx(
        "relative flex min-h-[100svh] w-full flex-col items-center justify-center px-6 text-center",
        className,
      )}
    >
      <div
        ref={orbRef}
        className="relative flex h-[min(42vmin,280px)] w-[min(42vmin,280px)] items-center justify-center"
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
            reduced !== true && "breathe",
          )}
          style={{
            background:
              "radial-gradient(circle at 35% 30%, var(--color-ember), var(--color-accent) 55%, var(--color-accent-deep) 100%)",
          }}
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        {handle ? (
          <p
            ref={handleRef}
            className="text-display sm:text-hero gradient-ink font-semibold break-all"
          >
            @{handle}
          </p>
        ) : null}

        <div className="text-ink-muted text-lead relative h-[1.6em] w-full">
          <GsapSwap id={STATUS_LINES[line]} className="absolute inset-x-0">
            {STATUS_LINES[line]}
            <span className="text-accent">…</span>
          </GsapSwap>
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
