"use client";

import { QrIdleScreen } from "@/components/event/qr-idle-screen";
import { PresentingExperience } from "@/components/event/presenting-experience";
import { useSpotlightStatus } from "@/components/event/use-spotlight-status";

/**
 * Fetches status on mount, then only when it needs to: every 5s while idle
 * (to notice a claim) and once at the server-reported expiry while presenting.
 * The recap itself is the same scroll-through as `/@handle`.
 */
export function SpotlightDisplay() {
  const { status } = useSpotlightStatus("display");

  if (status.status === "presenting") {
    // Keyed by username so a brand new claim mounts a fresh recap from the top
    // rather than resuming whatever scene the previous presenter left playing.
    return <PresentingExperience key={status.username} profile={status.profile} />;
  }

  return <QrIdleScreen />;
}
