"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cx } from "@/lib/cx";

/**
 * Soft light that tracks the pointer across the hero. Writes CSS custom properties
 * straight to the node so pointer movement never triggers a React render.
 */
export function Spotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cx("group/spotlight relative", className)}
      onPointerMove={
        reduced
          ? undefined
          : (event) => {
              const node = ref.current;
              if (!node) {
                return;
              }

              const bounds = node.getBoundingClientRect();
              node.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
              node.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
              node.style.setProperty("--spot-opacity", "1");
            }
      }
      onPointerLeave={() => ref.current?.style.setProperty("--spot-opacity", "0")}
    >
      {reduced ? null : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[var(--spot-opacity,0)] transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 70%)",
          }}
        />
      )}
      {children}
    </div>
  );
}
