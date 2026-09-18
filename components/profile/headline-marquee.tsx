import {
  formatCompactNumber,
  formatDuration,
  formatFullNumber,
} from "@/lib/derive";
import type { CountKind } from "@/components/profile/primitives/count-up";
import { CountUp } from "@/components/profile/primitives/count-up";
import { Entrance } from "@/components/profile/primitives/entrance";
import { cx } from "@/lib/cx";

export type HeadlineStat = {
  id: string;
  label: string;
  amount: number;
  kind: CountKind;
  detail: string;
  /** The one number that breaks the pattern in scale and colour. */
  emphasis?: boolean;
};

export function formatStat(stat: HeadlineStat): string {
  switch (stat.kind) {
    case "compact":
      return formatCompactNumber(stat.amount);
    case "duration":
      return formatDuration(stat.amount);
    case "integer":
      return formatFullNumber(stat.amount);
    default: {
      const exhaustive: never = stat.kind;
      return exhaustive;
    }
  }
}

export function HeadlineMarquee({ stats }: { stats: HeadlineStat[] }) {
  const ordered = [...stats].sort(
    (a, b) => Number(!!b.emphasis) - Number(!!a.emphasis),
  );

  return (
    <div className="grid gap-4 py-8 sm:grid-cols-3 sm:gap-6">
      {ordered.map((stat, index) => (
        <Entrance
          key={stat.id}
          delay={0.55 + index * 0.14}
          className={cx(index === 0 && "sm:col-span-3")}
        >
          <div className="border-edge bg-surface-glass h-full rounded-2xl border p-6">
            <p className="text-ink-faint text-micro mb-3 tracking-[0.22em] uppercase">
              {stat.label}
            </p>
            <p
              className={cx(
                "tabular",
                stat.emphasis
                  ? "text-display sm:text-hero text-accent"
                  : "text-heading sm:text-display text-ink",
              )}
            >
              <CountUp
                amount={stat.amount}
                kind={stat.kind}
                delay={0.7 + index * 0.14}
                duration={stat.emphasis ? 1.8 : 1.2}
              />
            </p>
            <p className="text-ink-muted text-small mt-3">{stat.detail}</p>
          </div>
        </Entrance>
      ))}
    </div>
  );
}
