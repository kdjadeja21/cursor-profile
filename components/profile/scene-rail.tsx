"use client";

import { motion, useReducedMotion } from "motion/react";
import type { SceneDefinition } from "@/components/profile/scene";
import { cx } from "@/lib/cx";

export function scrollToScene(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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

  return (
    <motion.nav
      aria-label="Scenes"
      initial={reduced ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 1.2 }}
      className="fixed top-1/2 right-2 z-40 hidden -translate-y-1/2 md:block lg:right-5"
    >
      <ol className="flex flex-col gap-3">
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
                {isActive ? (
                  <motion.span
                    layoutId="scene-rail-ring"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="border-accent shadow-glow absolute inset-0 rounded-full border"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
}
