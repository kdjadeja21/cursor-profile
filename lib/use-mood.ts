"use client";

import { useEffect } from "react";

export type Mood = "idle" | "loading" | "profile";

/**
 * Sets `data-mood` on <html> while the component is mounted so the persistent aurora
 * backdrop can shift intensity without any prop drilling across route boundaries.
 */
export function useMood(mood: Mood) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.mood;
    root.dataset.mood = mood;

    return () => {
      if (root.dataset.mood === mood) {
        if (previous) {
          root.dataset.mood = previous;
        } else {
          delete root.dataset.mood;
        }
      }
    };
  }, [mood]);
}
