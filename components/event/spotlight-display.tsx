"use client";

import { useEffect, useState } from "react";
import { QrIdleScreen } from "@/components/event/qr-idle-screen";
import { PresentingExperience } from "@/components/event/presenting-experience";
import type { SpotlightStatusResponse } from "@/lib/spotlight-lock";

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
 * Polls the status endpoint every ~2s (PRD §7). Expiry is entirely server-computed
 * (FR5) — this component doesn't run its own countdown; it just swaps to idle
 * once a poll reports `status: "idle"` again. When presenting, it renders the
 * exact same scroll-through recap as `/@handle`.
 */
export function SpotlightDisplay() {
  const [status, setStatus] = useState<SpotlightStatusResponse>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const next = await fetchStatus();
      if (!cancelled && next) {
        setStatus(next);
      }
    };

    void poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (status.status === "presenting") {
    // Keyed by username so a brand new claim mounts a fresh recap from the top
    // rather than resuming whatever scene the previous presenter left playing.
    return <PresentingExperience key={status.username} profile={status.profile} />;
  }

  return <QrIdleScreen />;
}
