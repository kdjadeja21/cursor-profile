"use client";

import { QrIdleScreen } from "@/components/event/qr-idle-screen";
import { PresentingExperience } from "@/components/event/presenting-experience";
import { useSpotlightStatus } from "@/components/event/use-spotlight-status";

/**
 * Polls the shared status hook every ~2s (PRD §7). Expiry is entirely
 * server-computed (FR5) — this component doesn't run its own countdown; it
 * swaps to idle once a poll reports `status: "idle"` again. When presenting,
 * it renders the exact same scroll-through recap as `/@handle`.
 */
export function SpotlightDisplay() {
  const status = useSpotlightStatus();

  if (status.status === "presenting") {
    // Keyed by username so a brand new claim mounts a fresh recap from the top
    // rather than resuming whatever scene the previous presenter left playing.
    return <PresentingExperience key={status.username} profile={status.profile} />;
  }

  return <QrIdleScreen />;
}
