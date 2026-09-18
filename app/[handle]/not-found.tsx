import Link from "next/link";
import { SplitText } from "@/components/fx/split-text";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <p className="text-accent text-small tracking-[0.32em] uppercase">
        <SplitText text="No signal" by="words" />
      </p>
      <h1 className="text-hero sm:text-giant overflow-visible font-extrabold">
        <SplitText text="404" by="chars" delay={0.2} unitClassName="gradient-ink" caret />
      </h1>
      <p className="text-heading text-ink max-w-xl font-semibold">
        No public profile here
      </p>
      <p className="text-ink-muted text-lead max-w-md">
        That handle either doesn&rsquo;t exist or its profile isn&rsquo;t public
        yet.
      </p>
      <Link
        href="/"
        className="glass shimmer text-ink hover:border-accent/60 hover:shadow-glow focus-visible:ring-ink text-lead relative mt-4 overflow-hidden rounded-full px-8 py-4 transition-[box-shadow,border-color] outline-none focus-visible:ring-2"
      >
        Try another username
      </Link>
    </main>
  );
}
