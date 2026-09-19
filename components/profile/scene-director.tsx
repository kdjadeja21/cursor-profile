"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SceneDefinition } from "@/components/profile/scene";
import { GsapFill } from "@/components/fx/gsap-fill";
import { GsapSwap } from "@/components/fx/gsap-swap";
import { gsap, useGSAP } from "@/lib/gsap";
import { isSceneScrolling } from "@/lib/scroll-to-scene";
import { useIsClient } from "@/lib/use-is-client";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Plays the scenes as a paced recap so nobody has to touch the screen. The first
 * wheel hands control back; later wheels ease to the next scene instead of snapping.
 */
export function SceneDirector({
  scenes,
  activeIndex,
  paused,
  onPausedChange,
  onJump,
}: {
  scenes: SceneDefinition[];
  activeIndex: number;
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
  onJump: (index: number) => void;
}) {
  const reduced = useReducedMotion();
  const pillRef = useRef<HTMLDivElement>(null);
  // The server never knows the motion preference, so the control stays unrendered
  // until after hydration to keep the markup identical on both sides.
  const isClient = useIsClient();

  // Auto-advance is a default, never a trap: it only arms when motion is allowed,
  // and it stops on its own at the final scene.
  const armed = isClient && reduced === false;
  const isLast = activeIndex >= scenes.length - 1;
  const playing = armed && !paused && !isLast;
  const dwell = scenes[activeIndex]?.dwellMs ?? 0;

  useEffect(() => {
    if (!playing || dwell <= 0) {
      return;
    }

    const timer = setTimeout(() => onJump(activeIndex + 1), dwell);
    return () => clearTimeout(timer);
  }, [activeIndex, dwell, onJump, playing]);

  const step = useCallback(
    (delta: number) => {
      const next = Math.min(scenes.length - 1, Math.max(0, activeIndex + delta));
      if (next !== activeIndex) {
        onJump(next);
      }
    },
    [activeIndex, onJump, scenes.length],
  );

  useEffect(() => {
    const handOver = () => onPausedChange(true);
    let ignoreUntil = 0;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "BUTTON", "A"].includes(target.tagName)) {
        return;
      }

      switch (event.key) {
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          handOver();
          step(1);
          break;
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          handOver();
          step(-1);
          break;
        case "Home":
          event.preventDefault();
          handOver();
          onJump(0);
          break;
        case "End":
          event.preventDefault();
          handOver();
          onJump(scenes.length - 1);
          break;
        default:
      }
    };

    const sceneAt = (index: number) =>
      document.querySelector<HTMLElement>(`section[data-scene-index="${index}"]`);

    const canLeaveScene = (deltaY: number) => {
      const section = sceneAt(activeIndex);
      if (!section) {
        return true;
      }

      const overflowing = section.offsetHeight > window.innerHeight + 24;
      if (!overflowing) {
        return true;
      }

      const top = window.scrollY + section.getBoundingClientRect().top;
      const bottom = top + section.offsetHeight;
      const edge = 28;

      if (deltaY > 0) {
        return window.scrollY + window.innerHeight >= bottom - edge;
      }

      return window.scrollY <= top + edge;
    };

    const onWheel = (event: WheelEvent) => {
      if (!armed || Math.abs(event.deltaY) < 8) {
        return;
      }

      if (playing) {
        event.preventDefault();
        handOver();
        ignoreUntil = performance.now() + 360;
        return;
      }

      if (performance.now() < ignoreUntil || isSceneScrolling()) {
        event.preventDefault();
        return;
      }

      if (!canLeaveScene(event.deltaY)) {
        return;
      }

      const delta = event.deltaY > 0 ? 1 : -1;
      const next = activeIndex + delta;
      if (next < 0 || next >= scenes.length) {
        return;
      }

      event.preventDefault();
      handOver();
      step(delta);
    };

    if (armed) {
      window.addEventListener("wheel", onWheel, { passive: false });
    }
    window.addEventListener("touchstart", handOver, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", handOver);
      window.removeEventListener("keydown", onKey);
    };
  }, [activeIndex, armed, onJump, onPausedChange, playing, scenes.length, step]);

  useGSAP(
    () => {
      const pill = pillRef.current;
      if (!pill || !armed) {
        return;
      }

      gsap.fromTo(
        pill,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, delay: 1.4, ease: "expo.out" },
      );
    },
    { dependencies: [armed] },
  );

  if (!armed) {
    return null;
  }

  const label = playing
    ? "Playing the recap · scroll to take over"
    : isLast
      ? "That's the recap"
      : `${scenes[activeIndex]?.label ?? ""} · ${activeIndex + 1} / ${scenes.length}`;
  const shortLabel = playing
    ? "Playing · scroll"
    : isLast
      ? "That's the recap"
      : `${activeIndex + 1} / ${scenes.length}`;

  return (
    <div
      ref={pillRef}
      className="fixed inset-x-0 bottom-12 z-40 flex justify-center px-3 sm:bottom-14 sm:px-4"
    >
      <div className="glass flex items-center gap-1 rounded-full py-1.5 pr-2 pl-2">
        <button
          type="button"
          onClick={() => {
            if (isLast) {
              onJump(0);
              onPausedChange(false);
              return;
            }
            onPausedChange(!paused);
          }}
          aria-label={
            isLast ? "Replay the recap" : playing ? "Pause the recap" : "Play the recap"
          }
          className="text-ink hover:bg-white/10 focus-visible:ring-ink flex h-9 w-9 items-center justify-center rounded-full outline-none focus-visible:ring-2"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="2" y="1.5" width="3.5" height="11" rx="1" fill="currentColor" />
              <rect x="8.5" y="1.5" width="3.5" height="11" rx="1" fill="currentColor" />
            </svg>
          ) : isLast ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 2.2a4.8 4.8 0 1 0 4.6 3.4"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
              />
              <path d="M9.4 1.4l2.6 1.1-1.1 2.6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M3 1.8v10.4a.8.8 0 0 0 1.2.7l8.2-5.2a.8.8 0 0 0 0-1.4L4.2 1.1A.8.8 0 0 0 3 1.8Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>

        <div className="relative flex h-9 min-w-0 max-w-[min(58vw,280px)] items-center overflow-hidden px-2 sm:min-w-[240px] sm:max-w-none sm:px-3">
          <GsapSwap id={label} className="min-w-0">
            <span className="text-ink-muted text-micro truncate tracking-[0.18em] uppercase">
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </GsapSwap>

          {playing && dwell > 0 ? (
            <div
              aria-hidden="true"
              className="bg-edge absolute inset-x-3 bottom-0.5 h-px overflow-hidden rounded-full"
            >
              <GsapFill
                key={activeIndex}
                play
                duration={dwell / 1000}
                ease="none"
                className="bg-accent h-full rounded-full"
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            onPausedChange(true);
            step(1);
          }}
          disabled={isLast}
          aria-label="Next scene"
          className="text-ink hover:bg-white/10 focus-visible:ring-ink flex h-9 w-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 disabled:opacity-30"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M3 5l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
