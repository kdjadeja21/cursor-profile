import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-ink-faint text-micro tracking-[0.2em] uppercase">
        404
      </p>
      <h1 className="text-display text-ink max-w-lg">
        No public profile here
      </h1>
      <p className="text-ink-muted text-base max-w-md">
        That handle either doesn&rsquo;t exist or its profile isn&rsquo;t public
        yet.
      </p>
      <Link
        href="/"
        className="border-edge-strong text-small hover:border-accent hover:text-accent rounded-full border px-5 py-2 transition-colors"
      >
        Try another username
      </Link>
    </main>
  );
}
