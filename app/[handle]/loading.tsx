function Block({ className }: { className: string }) {
  return (
    <div className={`bg-surface-glass animate-pulse rounded-2xl ${className}`} />
  );
}

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading profile"
      className="mx-auto w-full max-w-5xl px-6 pb-24 sm:px-8"
    >
      <div className="flex items-center gap-8 pt-16 sm:pt-24">
        <Block className="h-24 w-24 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3">
          <Block className="h-6 w-40" />
          <Block className="h-12 w-72 max-w-full" />
          <Block className="h-5 w-32" />
        </div>
      </div>

      <div className="grid gap-4 py-8 sm:grid-cols-3 sm:gap-6">
        <Block className="h-40 sm:col-span-3" />
        <Block className="h-32" />
        <Block className="h-32" />
      </div>

      <div className="space-y-12 py-12">
        <Block className="h-56" />
        <Block className="h-48" />
        <Block className="h-64" />
      </div>
    </main>
  );
}
