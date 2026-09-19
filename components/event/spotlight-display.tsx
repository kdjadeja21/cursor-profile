"use client";

import { useEffect, useState } from "react";
import { QrIdleScreen } from "@/components/event/qr-idle-screen";
import { PresentingCard } from "@/components/event/presenting-card";
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
 * Polls the status endpoint every ~2s (PRD §7). `secondsRemaining` always comes
 * from the server response — the display never runs its own countdown timer, so a
 * refresh or a stuck tab can't desync from the real expiry (FR5).
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
    return <PresentingCard profile={status.profile} secondsRemaining={status.secondsRemaining} />;
  }

  return <QrIdleScreen />;
}
