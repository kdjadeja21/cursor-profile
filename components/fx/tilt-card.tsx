"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cx } from "@/lib/cx";

/**
 * Glass card that tilts toward the pointer with a moving specular highlight. Writes
 * transforms and CSS variables straight to the node so hovering never re-renders React.
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

  const reset = () => {
    const node = ref.current;
    if (!node) {
      return;
    }

    node.style.transform = "";
    node.style.setProperty("--sheen-opacity", "0");
  };

  return (
    <div
      ref={ref}
      className={cx(
        "glass glass-sheen rounded-3xl transition-[transform,box-shadow] duration-300 ease-out will-change-transform",
        glow && "hover:shadow-glow",
        className,
      )}
      style={{ transformStyle: "preserve-3d" }}
      onPointerMove={
        reduced
          ? undefined
          : (event) => {
              const node = ref.current;
              if (!node) {
                return;
              }

              const bounds = node.getBoundingClientRect();
              const px = (event.clientX - bounds.left) / bounds.width;
              const py = (event.clientY - bounds.top) / bounds.height;
              const rotateY = (px - 0.5) * intensity * 2;
              const rotateX = (0.5 - py) * intensity * 2;

              node.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0) scale(1.015)`;
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
