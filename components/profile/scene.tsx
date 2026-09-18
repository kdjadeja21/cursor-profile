"use client";

import { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";
import { SplitText } from "@/components/fx/split-text";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
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
  const headerRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const centred = align === "center";

  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header || reduced !== false) {
        return;
      }

      const eyebrowNode = header.querySelector("[data-scene-eyebrow]");
      const descriptionNode = header.querySelector("[data-scene-description]");

      if (!ready) {
        if (eyebrowNode) {
          gsap.set(eyebrowNode, { opacity: 0, x: centred ? 0 : -24 });
        }
        if (descriptionNode) {
          gsap.set(descriptionNode, { opacity: 0, y: 14 });
        }
        return;
      }

      if (eyebrowNode) {
        gsap.fromTo(
          eyebrowNode,
          { opacity: 0, x: centred ? 0 : -24 },
          { opacity: 1, x: 0, duration: 0.6, ease: "expo.out", overwrite: "auto" },
        );
      }

      if (descriptionNode) {
        gsap.fromTo(
          descriptionNode,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.45, ease: "expo.out", overwrite: "auto" },
        );
      }
    },
    { dependencies: [ready, reduced, centred] },
  );

  return (
    <SceneContext.Provider value={{ ready, active, index }}>
      <section
        id={id}
        aria-labelledby={title ? `${id}-title` : undefined}
        data-scene-index={index}
        className={cx(
          "relative flex min-h-[100svh] w-full snap-start flex-col justify-center overflow-visible px-4 py-10 pb-24 sm:px-8 sm:py-12 sm:pb-28 lg:py-16 lg:pl-16 lg:pr-28",
          className,
        )}
      >
        <div className="mx-auto flex w-full max-w-[min(100%,1600px)] flex-col justify-center overflow-visible">
          {eyebrow || title ? (
            <header
              ref={headerRef}
              className={cx("mb-6 overflow-visible sm:mb-8 lg:mb-10", centred && "text-center")}
            >
              {eyebrow ? (
                <p
                  data-scene-eyebrow=""
                  className="text-accent text-small mb-4 flex items-center gap-3 font-medium tracking-[0.3em] uppercase"
                  style={centred ? { justifyContent: "center" } : undefined}
                >
                  <span aria-hidden="true" className="bg-accent shadow-glow h-px w-10" />
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h2
                  id={`${id}-title`}
                  className="text-display max-w-[18ch] overflow-visible font-bold text-balance sm:max-w-none"
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
                <p
                  data-scene-description=""
                  className={cx(
                    "text-ink-muted text-lead mt-5 max-w-2xl",
                    centred && "mx-auto",
                  )}
                >
                  {description}
                </p>
              ) : null}
            </header>
          ) : null}
          {children}
        </div>
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
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node || reduced !== false) {
        return;
      }

      let hidden: { x: number; y: number; scale: number };
      switch (from) {
        case "left":
          hidden = { x: -36, y: 0, scale: 1 };
          break;
        case "right":
          hidden = { x: 36, y: 0, scale: 1 };
          break;
        case "scale":
          hidden = { x: 0, y: 0, scale: 0.88 };
          break;
        case "up":
          hidden = { x: 0, y: 28, scale: 1 };
          break;
        default: {
          const exhaustive: never = from;
          void exhaustive;
          hidden = { x: 0, y: 28, scale: 1 };
        }
      }

      if (!ready) {
        gsap.set(node, { opacity: 0, ...hidden });
        return;
      }

      gsap.fromTo(
        node,
        { opacity: 0, ...hidden },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay,
          ease: "expo.out",
          overwrite: "auto",
        },
      );
    },
    { dependencies: [ready, reduced, delay, from] },
  );

  return (
    <div ref={ref} className={cx("overflow-visible will-change-transform", className)}>
      {children}
    </div>
  );
}
