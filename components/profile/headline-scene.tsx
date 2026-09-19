"use client";

import {
  formatCompactNumber,
  formatDuration,
  formatFullNumber,
} from "@/lib/derive";
import type { CountKind } from "@/components/profile/primitives/count-up";
import { CountUp } from "@/components/profile/primitives/count-up";
import { TiltCard } from "@/components/fx/tilt-card";
import { SceneItem, useScene } from "@/components/profile/scene";

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

export function HeadlineScene({ stats }: { stats: HeadlineStat[] }) {
  const { ready } = useScene();
  const lead = stats.find((stat) => stat.emphasis) ?? stats[0];
  const rest = stats.filter((stat) => stat !== lead);

  return (
    <div className="flex flex-col items-center gap-8 sm:gap-12 lg:gap-16">
      {lead ? (
        <div className="text-center">
          <SceneItem delay={0.2}>
            <p className="text-ink-faint text-small mb-4 tracking-[0.3em] uppercase">
              {lead.label}
            </p>
          </SceneItem>
          <SceneItem delay={0.35} from="scale">
            <p className="text-hero sm:text-giant overflow-visible pr-[0.18em] font-extrabold tracking-normal tabular">
              <CountUp
                amount={lead.amount}
                kind={lead.kind}
                start={ready}
                delay={0.5}
                duration={2.4}
                className="gradient-accent overflow-visible pr-[0.12em]"
              />
            </p>
          </SceneItem>
          <SceneItem delay={1.6}>
            <p className="text-ink-muted text-lead mt-4">{lead.detail}</p>
          </SceneItem>
        </div>
      ) : null}

      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
        {rest.map((stat, index) => (
          <SceneItem
            key={stat.id}
            delay={1.2 + index * 0.18}
            from={index % 2 === 0 ? "left" : "right"}
          >
            <TiltCard className="h-full p-5 sm:p-8 lg:p-10" glow>
              <p className="text-ink-faint text-small mb-4 tracking-[0.3em] uppercase">
                {stat.label}
              </p>
              <p className="text-display text-ink tabular font-bold">
                <CountUp
                  amount={stat.amount}
                  kind={stat.kind}
                  start={ready}
                  delay={1.5 + index * 0.2}
                  duration={1.6}
                />
              </p>
              <p className="text-ink-muted text-base mt-4">{stat.detail}</p>
            </TiltCard>
          </SceneItem>
        ))}
      </div>
    </div>
  );
}
