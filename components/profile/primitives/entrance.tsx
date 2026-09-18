import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Staggered entry for above-the-fold content. Deliberately CSS-only: it starts at
 * first paint instead of waiting for hydration, and it never leaves the server-rendered
 * markup stuck at opacity 0. The global reduced-motion rule collapses it to its end state.
 */
export function Entrance({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "animate-[rise-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]",
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
