import type { Metadata } from "next";
import { EventEntry } from "@/components/event/event-entry";
import { CURATED_HANDLES } from "@/lib/spotlight-lock";

export const metadata: Metadata = {
  title: "Live Profile Spotlight · Cursor",
  description: "Claim the main screen for 60 seconds with your Cursor profile.",
};

export default function EventEntryPage() {
  return <EventEntry hasSurprise={CURATED_HANDLES.length > 0} />;
}
