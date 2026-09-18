"use client";

import { useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-accent text-surface shadow-glow hover:shadow-glow-lg focus-visible:ring-ink",
  ghost:
    "border-edge-strong text-ink-muted hover:text-ink hover:border-ink/40 border bg-white/[0.03] focus-visible:ring-ink",
};

/**
 * Button that leans toward the pointer and sweeps a light bar across on hover.
 * Transform is written to the node directly so pointer movement never re-renders.
 */
export function MagneticButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  size?: "md" | "lg";
} & Omit<ComponentPropsWithoutRef<"button">, "children">) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onPointerMove={(event) => {
        rest.onPointerMove?.(event);
        const node = ref.current;
        if (reduced || !node) {
          return;
        }

        const bounds = node.getBoundingClientRect();
        const x = (event.clientX - (bounds.left + bounds.width / 2)) * 0.22;
        const y = (event.clientY - (bounds.top + bounds.height / 2)) * 0.32;
        node.style.transform = `translate(${x}px, ${y}px) scale(1.04)`;
      }}
      onPointerLeave={(event) => {
        rest.onPointerLeave?.(event);
        if (ref.current) {
          ref.current.style.transform = "";
        }
      }}
      className={cx(
        "shimmer relative overflow-hidden rounded-full font-medium transition-[transform,box-shadow,color,border-color,opacity] duration-300 ease-out outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60",
        size === "lg" ? "text-lead px-9 py-4" : "text-base px-6 py-3",
        VARIANT_CLASS[variant],
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
