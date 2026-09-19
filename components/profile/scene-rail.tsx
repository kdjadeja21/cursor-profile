"use client";

import { useRef } from "react";
import type { SceneDefinition } from "@/components/profile/scene";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

/** Fixed progress rail. The active marker slides between stops rather than jumping. */
export function SceneRail({
  scenes,
  activeIndex,
  onJump,
}: {
  scenes: SceneDefinition[];
  activeIndex: number;
  onJump: (index: number) => void;
}) {
  const reduced = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const nav = navRef.current;
      if (!nav || reduced !== false) {
        return;
      }

      gsap.fromTo(
        nav,
        { opacity: 0, x: 24 },
        { opacity: 1, x: 0, duration: 0.8, delay: 1.2, ease: "expo.out" },
      );
    },
    { dependencies: [reduced] },
  );

  useGSAP(
    () => {
      const list = listRef.current;
      const ring = ringRef.current;
      if (!list || !ring) {
        return;
      }

      // Measure the <li>, not the button: button.offsetTop is relative to the
      // row, so it is always ~0 and the ring stayed parked on the first stop.
      const item = list.querySelectorAll<HTMLLIElement>(":scope > li")[activeIndex];
      if (!item) {
        return;
      }

      const listBox = list.getBoundingClientRect();
      const itemBox = item.getBoundingClientRect();
      const y = itemBox.top - listBox.top;

      gsap.to(ring, {
        y,
        duration: reduced === false ? 0.45 : 0,
        ease: "expo.out",
        overwrite: "auto",
      });
    },
    { dependencies: [activeIndex, reduced, scenes.length] },
  );

  return (
    <nav
      ref={navRef}
      aria-label="Scenes"
      className="fixed top-1/2 right-2 z-40 hidden -translate-y-1/2 md:block lg:right-5"
    >
      <ol ref={listRef} className="relative flex flex-col gap-3">
        <span
          ref={ringRef}
          aria-hidden="true"
          className="border-accent shadow-glow pointer-events-none absolute top-0 right-0 h-5 w-5 rounded-full border"
        />
        {scenes.map((scene, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={scene.id} className="group relative flex items-center justify-end">
              <span
                aria-hidden="true"
                className={cx(
                  "text-micro pointer-events-none absolute right-8 tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-300",
                  isActive
                    ? "text-ink translate-x-0 opacity-100"
                    : "text-ink-faint translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                )}
              >
                {scene.label}
              </span>
              <button
                type="button"
                aria-label={`Go to ${scene.label}`}
                aria-current={isActive ? "step" : undefined}
                onClick={() => onJump(index)}
                className="focus-visible:ring-ink relative flex h-5 w-5 items-center justify-center rounded-full outline-none focus-visible:ring-2"
              >
                <span
                  className={cx(
                    "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                    isActive ? "bg-accent" : "bg-ink/30 group-hover:bg-ink/60",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
