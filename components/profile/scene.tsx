"use client";

import { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { SplitText } from "@/components/fx/split-text";
import { cx } from "@/lib/cx";

export type SceneDefinition = {
  id: string;
  label: string;
  /** How long the director holds on this scene before advancing. 0 stops there. */
  dwellMs: number;
};

type SceneState = {
  /** Has been on screen at least once; choreography fires from this. */
  ready: boolean;
  /** Currently the dominant scene in the viewport. */
  active: boolean;
  index: number;
};

const SceneContext = createContext<SceneState>({
  ready: true,
  active: true,
  index: 0,
});

export function useScene(): SceneState {
  return useContext(SceneContext);
}

/**
 * One viewport-sized stop in the recap. `active` and `ready` are measured by the
 * shell from scroll position rather than per-scene IntersectionObservers, whose
 * state updates were arriving a beat late after long jumps.
 */
export function Scene({
  id,
  index,
  active,
  ready,
  eyebrow,
  title,
  description,
  children,
  className,
  align = "left",
}: {
  id: string;
  index: number;
  active: boolean;
  ready: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Outgoing scenes shrink and dim as the next one snaps in, so the cut reads as a
  // camera move rather than a page scroll.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.98, 1, 0.98]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  const centred = align === "center";

  return (
    <SceneContext.Provider value={{ ready, active, index }}>
      <section
        ref={ref}
        id={id}
        aria-labelledby={title ? `${id}-title` : undefined}
        data-scene-index={index}
        className={cx(
          "relative flex min-h-[100svh] w-full snap-start flex-col justify-center px-4 py-10 pb-24 sm:px-8 sm:py-12 sm:pb-28 lg:py-16 lg:pl-16 lg:pr-28",
          className,
        )}
      >
        <motion.div
          style={reduced ? undefined : { scale, opacity }}
          className="mx-auto flex w-full max-w-[min(100%,1600px)] flex-col justify-center will-change-transform"
        >
          {eyebrow || title ? (
            <header className={cx("mb-6 sm:mb-8 lg:mb-10", centred && "text-center")}>
              {eyebrow ? (
                <motion.p
                  initial={reduced ? false : { opacity: 0, x: centred ? 0 : -24 }}
                  animate={ready ? { opacity: 1, x: 0 } : undefined}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-accent text-small mb-4 flex items-center gap-3 font-medium tracking-[0.3em] uppercase"
                  style={centred ? { justifyContent: "center" } : undefined}
                >
                  <span aria-hidden="true" className="bg-accent shadow-glow h-px w-10" />
                  {eyebrow}
                </motion.p>
              ) : null}
              {title ? (
                <h2
                  id={`${id}-title`}
                  className="text-display max-w-[18ch] font-bold text-balance sm:max-w-none"
                >
                  <SplitText
                    text={title}
                    by="words"
                    start={ready}
                    delay={0.15}
                    unitClassName="gradient-ink"
                  />
                </h2>
              ) : null}
              {description ? (
                <motion.p
                  initial={reduced ? false : { opacity: 0, y: 14 }}
                  animate={ready ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={cx(
                    "text-ink-muted text-lead mt-5 max-w-2xl",
                    centred && "mx-auto",
                  )}
                >
                  {description}
                </motion.p>
              ) : null}
            </header>
          ) : null}
          {children}
        </motion.div>
      </section>
    </SceneContext.Provider>
  );
}

/** Staggered child reveal that waits for its scene to be on screen. */
export function SceneItem({
  children,
  delay = 0,
  className,
  from = "up",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  from?: "up" | "left" | "right" | "scale";
}) {
  const { ready } = useScene();
  const reduced = useReducedMotion();

  const hidden =
    from === "left"
      ? { opacity: 0, x: -40 }
      : from === "right"
        ? { opacity: 0, x: 40 }
        : from === "scale"
          ? { opacity: 0, scale: 0.8 }
          : { opacity: 0, y: 36 };

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { ...hidden, filter: "blur(10px)" }}
      animate={ready ? { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" } : undefined}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
