import {
  formatCompactNumber,
  formatDuration,
  formatFullNumber,
} from "@/lib/derive";
import { cx } from "@/lib/cx";

export type HeadlineStat = {
  id: string;
  label: string;
  amount: number;
  kind: "compact" | "duration" | "integer";
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

export function HeadlineMarquee({
  stats,
  renderValue,
}: {
  stats: HeadlineStat[];
  /** Phase 2 swaps the static string for an animated counter. */
  renderValue?: (stat: HeadlineStat) => React.ReactNode;
}) {
  const [primary, ...rest] = [...stats].sort(
    (a, b) => Number(!!b.emphasis) - Number(!!a.emphasis),
  );

  return (
    <div className="grid gap-4 py-8 sm:grid-cols-3 sm:gap-6">
      {[primary, ...rest].map((stat, index) => (
        <div
          key={stat.id}
          className={cx(
            "border-edge bg-surface-glass rounded-2xl border p-6",
            index === 0 && "sm:col-span-3",
          )}
        >
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
            {renderValue ? renderValue(stat) : formatStat(stat)}
          </p>
          <p className="text-ink-muted text-small mt-3">{stat.detail}</p>
        </div>
      ))}
    </div>
  );
}
