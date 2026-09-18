import type { StreakStatus } from "@/lib/derive";
import { formatDayLabel } from "@/lib/derive";
import { GlassCard } from "@/components/profile/primitives/surfaces";
import { cx } from "@/lib/cx";

/** Glow and size grow with the run so a long streak reads as heavier at a glance. */
function orbScale(days: number): number {
  return Math.min(1, Math.log10(days + 1) / Math.log10(60));
}

function StreakOrb({ days, live }: { days: number; live: boolean }) {
  const intensity = orbScale(days);
  const size = 96 + Math.round(intensity * 72);
  const glow = 18 + Math.round(intensity * 54);

  return (
    <div
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className={cx(
          "absolute inset-0 rounded-full",
          live ? "bg-data-streak/20 breathe" : "bg-ink/10",
        )}
        style={{
          boxShadow: live
            ? `0 0 ${glow}px ${glow / 3}px color-mix(in srgb, var(--color-data-streak) 30%, transparent)`
            : undefined,
        }}
      />
      <div
        className={cx(
          "absolute rounded-full",
          live ? "bg-data-streak/35" : "bg-ink/15",
        )}
        style={{ inset: `${Math.round(size * 0.16)}px` }}
      />
      <span
        className={cx(
          "text-display tabular relative",
          live ? "text-data-streak" : "text-ink-muted",
        )}
      >
        {days}
      </span>
    </div>
  );
}

function statusCopy(streak: StreakStatus): { title: string; body: string } {
  if (streak.current === 0) {
    return {
      title: "No run in progress",
      body: "Ship something today and the counter starts over at one.",
    };
  }

  if (streak.isRecord) {
    return {
      title: "Running at a record",
      body: "This is the longest streak on record, and it is still going.",
    };
  }

  if (streak.atRisk) {
    return {
      title: "Streak at risk",
      body: `Last active ${formatDayLabel(streak.lastActiveDate ?? "")}. One more day keeps it alive.`,
    };
  }

  if (streak.isBroken) {
    return {
      title: "Run has cooled off",
      body: `Nothing tracked for ${streak.daysSinceActive} days.`,
    };
  }

  return {
    title: "Run in progress",
    body: `${streak.longest - streak.current} days from matching the record.`,
  };
}

export function Momentum({ streak }: { streak: StreakStatus }) {
  const status = statusCopy(streak);
  const progress =
    streak.longest > 0 ? Math.min(1, streak.current / streak.longest) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <StreakOrb days={streak.current} live={streak.current > 0 && !streak.isBroken} />
          <div className="min-w-0">
            <p className="text-ink-faint text-micro mb-2 tracking-[0.22em] uppercase">
              Current streak
            </p>
            <p className="text-title text-ink">{status.title}</p>
            <p className="text-ink-muted text-small mt-2 max-w-xs">
              {status.body}
            </p>
            {streak.atRisk ? (
              <p className="text-warn text-small mt-4 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="bg-warn breathe h-2 w-2 rounded-full"
                />
                Expires at the end of today
              </p>
            ) : null}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col justify-between p-6 sm:p-8">
        <div>
          <p className="text-ink-faint text-micro mb-2 tracking-[0.22em] uppercase">
            Longest streak
          </p>
          <p className="text-hero tabular text-ink leading-none">
            {streak.longest}
            <span className="text-title text-ink-faint ml-2">days</span>
          </p>
        </div>

        <div className="mt-8">
          <div
            className="bg-edge h-1.5 overflow-hidden rounded-full"
            role="img"
            aria-label={`Current streak is ${streak.current} of the ${streak.longest} day record`}
          >
            <div
              className="bg-data-streak h-full rounded-full"
              style={{ width: `${Math.max(progress * 100, streak.current > 0 ? 2 : 0)}%` }}
            />
          </div>
          <p className="text-ink-faint text-micro mt-3 tracking-[0.12em] uppercase">
            {streak.current} of {streak.longest} · record set on the books
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
