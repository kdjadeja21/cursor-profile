"use client";

import Image from "next/image";
import { formatCompactNumber } from "@/lib/derive";
import { useMood } from "@/lib/use-mood";
import type { SpotlightProfileSnapshot } from "@/lib/spotlight-lock";
import { EXPIRY_SECONDS } from "@/lib/spotlight-lock";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CountdownRing({ secondsRemaining }: { secondsRemaining: number }) {
  const progress = Math.max(0, Math.min(1, secondsRemaining / EXPIRY_SECONDS));
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90 sm:h-24 sm:w-24" aria-hidden="true">
      <circle cx="50" cy="50" r={RADIUS} className="stroke-white/10" strokeWidth="6" fill="none" />
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        stroke="var(--color-accent)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        transform="rotate(90 50 50)"
        className="fill-ink text-[26px] font-bold"
      >
        {secondsRemaining}
      </text>
    </svg>
  );
}

export function PresentingCard({
  profile,
  secondsRemaining,
}: {
  profile: SpotlightProfileSnapshot;
  secondsRemaining: number;
}) {
  useMood("profile");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-x-clip px-6 py-16 text-center">
      <div className="absolute top-8 right-8">
        <CountdownRing secondsRemaining={secondsRemaining} />
      </div>

      {profile.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt={profile.displayName}
          width={220}
          height={220}
          className="shadow-glow-lg h-[22vmin] w-[22vmin] min-h-[160px] min-w-[160px] rounded-full border-4 border-white/10 object-cover"
          unoptimized
        />
      ) : (
        <div className="glass shadow-glow-lg flex h-[22vmin] w-[22vmin] min-h-[160px] min-w-[160px] items-center justify-center rounded-full text-6xl font-bold">
          {profile.displayName.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div>
        <h1 className="text-giant font-bold text-balance">
          <span className="gradient-ink">{profile.displayName}</span>
        </h1>
        <p className="text-ink-muted text-lead mt-2">@{profile.handle}</p>
      </div>

      <div className="glass flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-3xl px-8 py-5">
        <Stat label="Tokens generated" value={formatCompactNumber(profile.stats.totalTokens)} />
        <Stat label="Agents run" value={formatCompactNumber(profile.stats.agentsTotal)} />
        <Stat label="Longest streak" value={`${profile.stats.longestStreak}d`} />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-display text-accent font-bold">{value}</span>
      <span className="text-micro text-ink-faint tracking-[0.24em] uppercase">{label}</span>
    </div>
  );
}
