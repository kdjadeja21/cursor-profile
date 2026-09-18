import type { Milestone } from "@/lib/derive";
import { GlassCard } from "@/components/profile/primitives/surfaces";
import { cx } from "@/lib/cx";

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const progress = milestone.progress
    ? Math.min(1, milestone.progress.current / milestone.progress.target)
    : 0;

  return (
    <GlassCard
      className={cx(
        "flex flex-col justify-between p-5",
        !milestone.earned && "border-dashed opacity-70",
      )}
    >
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cx(
              "h-1.5 w-1.5 rounded-full",
              milestone.kind === "record" && milestone.earned
                ? "bg-accent"
                : milestone.earned
                  ? "bg-success"
                  : "bg-ink-faint",
            )}
          />
          <span className="text-ink-faint text-micro tracking-[0.18em] uppercase">
            {milestone.earned ? milestone.kind : "Next up"}
          </span>
        </div>
        <p
          className={cx(
            "text-title tabular",
            milestone.kind === "record" && milestone.earned
              ? "text-accent"
              : "text-ink",
          )}
        >
          {milestone.title}
        </p>
        <p className="text-ink-muted text-small mt-2">{milestone.detail}</p>
      </div>

      {milestone.progress ? (
        <div className="mt-5">
          <div className="bg-edge h-1 overflow-hidden rounded-full">
            <div
              className="bg-ink-faint h-full rounded-full"
              style={{ width: `${Math.max(progress * 100, 1)}%` }}
            />
          </div>
          <p className="text-ink-faint text-micro mt-2 tabular">
            {milestone.progress.current} / {milestone.progress.target}{" "}
            {milestone.progress.unit}
          </p>
        </div>
      ) : null}
    </GlassCard>
  );
}

export function Milestones({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return (
      <p className="text-ink-faint text-small">
        Milestones unlock as activity is tracked.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {milestones.map((milestone) => (
        <MilestoneCard key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}
