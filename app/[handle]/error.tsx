"use client";

import Link from "next/link";
import { SplitText } from "@/components/fx/split-text";

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <p className="text-accent text-small tracking-[0.32em] uppercase">
        <SplitText text="No signal" by="words" />
      </p>
      <h1 className="text-hero sm:text-giant overflow-visible font-extrabold">
        <SplitText
          text="Couldn't load"
          by="words"
          delay={0.2}
          unitClassName="gradient-ink"
          caret
        />
      </h1>
      <p className="text-heading text-ink max-w-xl font-semibold">
        That profile is unavailable right now
      </p>
      <p className="text-ink-muted text-lead max-w-md">
        We couldn&rsquo;t load this profile. Try again in a moment.
      </p>
      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="glass shimmer text-ink hover:border-accent/60 hover:shadow-glow focus-visible:ring-ink text-lead relative overflow-hidden rounded-full px-8 py-4 transition-[box-shadow,border-color] outline-none focus-visible:ring-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-ink-muted hover:text-ink text-lead underline-offset-4 hover:underline"
        >
          Try another username
        </Link>
      </div>
    </main>
  );
}
