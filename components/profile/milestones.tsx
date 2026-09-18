"use client";

import { useRef } from "react";
import type { Milestone } from "@/lib/derive";
import { formatCompactNumber, formatFullNumber } from "@/lib/derive";
import { TiltCard } from "@/components/fx/tilt-card";
import { GsapFill } from "@/components/fx/gsap-fill";
import { SceneItem, useScene } from "@/components/profile/scene";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

function formatStat(value: number): string {
  return value >= 1000 ? formatCompactNumber(value) : formatFullNumber(value);
}

function MilestoneCard({
  milestone,
  index,
  dense,
}: {
  milestone: Milestone;
  index: number;
  dense: boolean;
}) {
  const { ready } = useScene();
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const progress = milestone.progress
    ? Math.min(1, milestone.progress.current / milestone.progress.target)
    : 0;
  const isRecord = milestone.kind === "record" && milestone.earned;

  useGSAP(
    () => {
      const node = cardRef.current;
      if (!node || reduced !== false) {
        return;
      }

      if (!ready) {
        gsap.set(node, { opacity: 0, rotateX: -28, y: 40 });
        return;
      }

      gsap.fromTo(
        node,
        { opacity: 0, rotateX: -28, y: 40 },
        {
          opacity: 1,
          rotateX: 0,
          y: 0,
          duration: 0.8,
          delay: 0.25 + index * 0.08,
          ease: "expo.out",
        },
      );
    },
    { dependencies: [ready, reduced, index] },
  );

  return (
    <div ref={cardRef} className="h-full min-h-0" style={{ perspective: 1200 }}>
      <TiltCard
        glow={milestone.earned}
        intensity={dense ? 4 : 8}
        className={cx(
          "flex h-full flex-col justify-between overflow-hidden",
          dense ? "p-3.5 sm:p-4" : "p-5 sm:p-7",
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
          <div className={cx("flex items-center gap-2.5", dense ? "mb-2.5" : "mb-4")}>
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
              "tabular font-bold",
              dense ? "text-title sm:text-heading" : "text-heading",
              isRecord ? "text-accent" : "text-ink",
            )}
          >
            {milestone.title}
          </p>
          <p className={cx("text-ink-muted mt-1.5", dense ? "text-small sm:text-base" : "text-base")}>
            {milestone.detail}
          </p>
        </div>

        {milestone.progress ? (
          <div className={cx("relative", dense ? "mt-4" : "mt-6")}>
            <div className="bg-edge h-1.5 overflow-hidden rounded-full">
              <GsapFill
                play={ready}
                duration={1.2}
                delay={0.7 + index * 0.08}
                className="bg-ink-muted h-full rounded-full"
                style={{ width: `${Math.max(progress * 100, 1)}%` }}
              />
            </div>
            <p className="text-ink-faint text-small mt-2 tabular">
              {formatStat(milestone.progress.current)} / {formatStat(milestone.progress.target)}{" "}
              {milestone.progress.unit}
            </p>
          </div>
        ) : null}
      </TiltCard>
    </div>
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

  const crowded = milestones.length > 6;

  return (
    <div
      className={cx(
        "grid w-full gap-2 sm:gap-3",
        crowded
          ? "max-h-[58svh] grid-cols-1 overflow-y-auto sm:grid-cols-2 lg:max-h-none lg:grid-cols-4 lg:overflow-visible"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {milestones.map((milestone, index) => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          index={index}
          dense={crowded}
        />
      ))}
    </div>
  );
}
