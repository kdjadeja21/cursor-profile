"use client";

import { useEffect, useState } from "react";
import {
  mergeSpotlightStatus,
  type SpotlightStatusResponse,
} from "@/lib/spotlight-lock";

const POLL_INTERVAL_MS = 2000;

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
 * Shared by `/event` and `/event/display`. Polls roughly every 2s (PRD §7)
 * and only replaces state when the session actually changes.
 */
export function useSpotlightStatus(): SpotlightStatusResponse {
  const [status, setStatus] = useState<SpotlightStatusResponse>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const next = await fetchStatus();
      if (cancelled || !next) {
        return;
      }

      setStatus((current) => mergeSpotlightStatus(current, next));
    };

    void poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}
