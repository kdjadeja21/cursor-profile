import type { Metadata } from "next";
import Image from "next/image";
import { ParticleField } from "@/components/fx/particle-field";
import { SplitText } from "@/components/fx/split-text";
import { EntryForm } from "@/components/event/entry-form";
import { CURATED_HANDLES } from "@/lib/spotlight-lock";

export const metadata: Metadata = {
  title: "Live Profile Spotlight · Cursor",
  description: "Claim the main screen for 60 seconds with your Cursor profile.",
};

export default function EventEntryPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-x-clip px-4 py-12 text-center sm:px-6 sm:py-16">
      <ParticleField />

      <div className="relative z-10 mb-10">
        <Image
          src="/cursor-lockup.svg"
          alt="Cursor"
          width={220}
          height={53}
          priority
          className="h-12 w-auto drop-shadow-[0_0_28px_rgba(245,78,0,0.45)] sm:h-16"
        />
      </div>

      <p className="text-accent text-micro relative z-10 mb-5 tracking-[0.32em] uppercase">
        <SplitText text="Live Profile Spotlight" by="words" delay={0.3} />
      </p>

      <h1 className="text-hero relative z-10 max-w-[14ch] overflow-visible font-bold">
        <SplitText
          text="Take the main screen"
          by="words"
          delay={0.45}
          unitClassName="gradient-ink"
          caret
        />
      </h1>

      <p className="text-ink-muted text-lead relative z-10 mt-4 max-w-lg">
        Enter your Cursor username to get spotlighted for 60 seconds — only one
        person can be up at a time.
      </p>

      <div className="relative z-10 mt-10 w-full max-w-2xl">
        <EntryForm hasSurprise={CURATED_HANDLES.length > 0} />
      </div>
    </main>
  );
}
