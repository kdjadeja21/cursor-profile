"use client";

import { useEffect, useState } from "react";

/**
 * `null` until the client has read the system preference, so SSR markup stays
 * fully visible. Matches the contract the recap already used with Motion.
 */
export function useReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}
