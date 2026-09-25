import type { Metadata } from "next";
import { SpotlightDisplay } from "@/components/event/spotlight-display";

export const metadata: Metadata = {
  title: "Live Profile Spotlight — Display",
  description:
    "Stage screen for the Live Profile Spotlight. Idle until a teammate claims a profile from their phone.",
  robots: { index: false, follow: false },
};

export default function EventDisplayPage() {
  return <SpotlightDisplay />;
}
