"use client";

import { useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
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
 * GSAP quickTo writes transforms on the compositor so pointer movement never
 * re-renders.
 */
export function MagneticButton({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  size?: "md" | "lg";
} & Omit<ComponentPropsWithoutRef<"button">, "children">) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const xTo = useRef<((value: number) => void) | null>(null);
  const yTo = useRef<((value: number) => void) | null>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) {
        return;
      }

      gsap.set(node, { x: 0, y: 0, scale: 1 });
      xTo.current = gsap.quickTo(node, "x", { duration: 0.35, ease: "power3.out" });
      yTo.current = gsap.quickTo(node, "y", { duration: 0.35, ease: "power3.out" });
    },
    { scope: ref },
  );

  return (
    <button
      ref={ref}
      type={type}
      {...rest}
      onPointerMove={(event) => {
        rest.onPointerMove?.(event);
        const node = ref.current;
        if (reduced !== false || !node) {
          return;
        }

        const bounds = node.getBoundingClientRect();
        const x = (event.clientX - (bounds.left + bounds.width / 2)) * 0.22;
        const y = (event.clientY - (bounds.top + bounds.height / 2)) * 0.32;
        xTo.current?.(x);
        yTo.current?.(y);
        gsap.to(node, { scale: 1.04, duration: 0.25, ease: "power3.out", overwrite: "auto" });
      }}
      onPointerLeave={(event) => {
        rest.onPointerLeave?.(event);
        const node = ref.current;
        if (!node) {
          return;
        }

        xTo.current?.(0);
        yTo.current?.(0);
        gsap.to(node, { scale: 1, duration: 0.45, ease: "expo.out", overwrite: "auto" });
      }}
      className={cx(
        "shimmer relative overflow-hidden rounded-full font-medium outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60",
        size === "lg"
          ? "text-base sm:text-lead px-6 py-3 sm:px-9 sm:py-4"
          : "text-small sm:text-base px-5 py-2.5 sm:px-6 sm:py-3",
        VARIANT_CLASS[variant],
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
