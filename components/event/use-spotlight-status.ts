"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  mergeSpotlightStatus,
  nextStatusDelayMs,
  type SpotlightStatusResponse,
  type SpotlightWatchMode,
} from "@/lib/spotlight-lock";

async function fetchStatus(): Promise<SpotlightStatusResponse | null> {
  try {
    const response = await fetch("/event/api/status", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as SpotlightStatusResponse;
  } catch {
    return null;
  }
}

/**
 * Watches spotlight state without a 1–2s poll loop.
 *
 * - First fetch on mount (and when the tab becomes visible again).
 * - Display + idle: one request every 5s, just to notice a new claim.
 * - Presenting: wait for the server-reported remaining time, then confirm once.
 * - Entry + idle: stop. The next claim (or a manual refresh) is the next check.
 */
export function useSpotlightStatus(mode: SpotlightWatchMode): {
  status: SpotlightStatusResponse;
  refresh: () => Promise<SpotlightStatusResponse | null>;
} {
  const [status, setStatus] = useState<SpotlightStatusResponse>({ status: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const armRef = useRef<(snapshot: SpotlightStatusResponse) => void>(() => {});

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const refresh = useCallback(async () => {
    const next = await fetchStatus();
    if (cancelledRef.current || !next) {
      return next;
    }

    setStatus((current) => mergeSpotlightStatus(current, next));
    armRef.current(next);
    return next;
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    armRef.current = (snapshot: SpotlightStatusResponse) => {
      clearTimer();
      if (cancelledRef.current || document.hidden) {
        return;
      }

      const delay = nextStatusDelayMs(snapshot, mode);
      if (delay === null) {
        return;
      }

      timerRef.current = setTimeout(() => {
        void refresh();
      }, delay);
    };

    void refresh();

    const onVisibility = () => {
      if (document.hidden) {
        clearTimer();
        return;
      }

      void refresh();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelledRef.current = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode, refresh]);

  return { status, refresh };
}
