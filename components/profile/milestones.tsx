"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Milestone } from "@/lib/derive";
import { TiltCard } from "@/components/fx/tilt-card";
import { SceneItem, useScene } from "@/components/profile/scene";
import { cx } from "@/lib/cx";

function MilestoneCard({
  milestone,
  index,
}: {
  milestone: Milestone;
  index: number;
}) {
  const { ready } = useScene();
  const reduced = useReducedMotion();
  const progress = milestone.progress
    ? Math.min(1, milestone.progress.current / milestone.progress.target)
    : 0;
  const isRecord = milestone.kind === "record" && milestone.earned;

  return (
    <motion.div
      className="h-full"
      style={{ perspective: 1200 }}
      initial={reduced ? false : { opacity: 0, rotateX: -35, y: 50 }}
      animate={ready ? { opacity: 1, rotateX: 0, y: 0 } : undefined}
      transition={{
        type: "spring",
        stiffness: 160,
        damping: 20,
        delay: 0.35 + index * 0.12,
      }}
    >
      <TiltCard
        glow={milestone.earned}
        className={cx(
          "flex h-full flex-col justify-between overflow-hidden p-7",
          !milestone.earned && "border-dashed opacity-80",
          isRecord && "border-accent/50 shimmer shimmer-auto",
        )}
      >
        {isRecord ? (
          <div
            aria-hidden="true"
            className="from-accent/20 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
          />
        ) : null}
        <div className="relative">
          <div className="mb-4 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={cx(
                "h-2 w-2 rounded-full",
                isRecord
                  ? "bg-accent shadow-[0_0_12px_var(--color-accent)]"
                  : milestone.earned
                    ? "bg-success shadow-[0_0_10px_var(--color-success)]"
                    : "bg-ink-faint",
              )}
            />
            <span className="text-ink-faint text-micro tracking-[0.24em] uppercase">
              {milestone.earned ? milestone.kind : "Next up"}
            </span>
          </div>
          <p
            className={cx(
              "text-heading tabular font-bold",
              isRecord ? "text-accent" : "text-ink",
            )}
          >
            {milestone.title}
          </p>
          <p className="text-ink-muted text-base mt-2">{milestone.detail}</p>
        </div>

        {milestone.progress ? (
          <div className="relative mt-6">
            <div className="bg-edge h-1.5 overflow-hidden rounded-full">
              <motion.div
                className="bg-ink-muted h-full origin-left rounded-full"
                style={{ width: `${Math.max(progress * 100, 1)}%` }}
                initial={reduced ? false : { scaleX: 0 }}
                animate={ready ? { scaleX: 1 } : undefined}
                transition={{ duration: 1.2, delay: 0.9 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="text-ink-faint text-small mt-2 tabular">
              {milestone.progress.current} / {milestone.progress.target}{" "}
              {milestone.progress.unit}
            </p>
          </div>
        ) : null}
      </TiltCard>
    </motion.div>
  );
}

export function Milestones({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return (
      <SceneItem>
        <p className="text-ink-faint text-lead">Milestones unlock as activity is tracked.</p>
      </SceneItem>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {milestones.map((milestone, index) => (
        <MilestoneCard key={milestone.id} milestone={milestone} index={index} />
      ))}
    </div>
  );
}
