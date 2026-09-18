"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

/**
 * Glass card that tilts toward the pointer with a moving specular highlight.
 * GSAP quickTo keeps the tilt on the compositor so hovering never re-renders.
 */
export function TiltCard({
  children,
  className,
  intensity = 8,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. */
  intensity?: number;
  /** Adds an accent-coloured outer glow. */
  glow?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rotateXTo = useRef<((value: number) => void) | null>(null);
  const rotateYTo = useRef<((value: number) => void) | null>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) {
        return;
      }

      gsap.set(node, { transformPerspective: 1100, rotateX: 0, rotateY: 0, scale: 1 });
      rotateXTo.current = gsap.quickTo(node, "rotateX", {
        duration: 0.4,
        ease: "power3.out",
      });
      rotateYTo.current = gsap.quickTo(node, "rotateY", {
        duration: 0.4,
        ease: "power3.out",
      });
    },
    { scope: ref },
  );

  const reset = () => {
    const node = ref.current;
    if (!node) {
      return;
    }

    rotateXTo.current?.(0);
    rotateYTo.current?.(0);
    gsap.to(node, { scale: 1, duration: 0.5, ease: "expo.out", overwrite: "auto" });
    node.style.setProperty("--sheen-opacity", "0");
  };

  return (
    <div
      ref={ref}
      className={cx(
        "glass glass-sheen rounded-3xl will-change-transform",
        glow && "hover:shadow-glow",
        className,
      )}
      onPointerMove={
        reduced !== false
          ? undefined
          : (event) => {
              const node = ref.current;
              if (!node) {
                return;
              }

              const bounds = node.getBoundingClientRect();
              const px = (event.clientX - bounds.left) / bounds.width;
              const py = (event.clientY - bounds.top) / bounds.height;
              rotateYTo.current?.((px - 0.5) * intensity * 2);
              rotateXTo.current?.((0.5 - py) * intensity * 2);
              gsap.to(node, {
                scale: 1.015,
                duration: 0.3,
                ease: "power3.out",
                overwrite: "auto",
              });
              node.style.setProperty("--tilt-x", `${px * 100}%`);
              node.style.setProperty("--tilt-y", `${py * 100}%`);
              node.style.setProperty("--sheen-opacity", "1");
            }
      }
      onPointerLeave={reset}
      onBlur={reset}
    >
      {children}
    </div>
  );
}
