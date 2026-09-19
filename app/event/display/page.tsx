import type { Metadata } from "next";
import { SpotlightDisplay } from "@/components/event/spotlight-display";

export const metadata: Metadata = {
  title: "Live Profile Spotlight — Display",
  description: "Presentation screen for the Live Profile Spotlight event feature.",
  robots: { index: false, follow: false },
};

export default function EventDisplayPage() {
  return <SpotlightDisplay />;
}
