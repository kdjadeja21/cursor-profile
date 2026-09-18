"use client";

import { useRef } from "react";
import type { StreakStatus } from "@/lib/derive";
import { formatDayLabel } from "@/lib/derive";
import { CountUp } from "@/components/profile/primitives/count-up";
import { TiltCard } from "@/components/fx/tilt-card";
import { GsapFill } from "@/components/fx/gsap-fill";
import { SceneItem, useScene } from "@/components/profile/scene";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

/** Glow and size grow with the run so a long streak reads as heavier at a glance. */
function orbScale(days: number): number {
  return Math.min(1, Math.log10(days + 1) / Math.log10(60));
}

const ARC_RADIUS = 46;
const ARC_LENGTH = 2 * Math.PI * ARC_RADIUS;

function StreakOrb({
  days,
  live,
  progress,
  ready,
}: {
  days: number;
  live: boolean;
  progress: number;
  ready: boolean;
}) {
  const reduced = useReducedMotion();
  const arcRef = useRef<SVGCircleElement>(null);
  const intensity = orbScale(days);
  const glow = 40 + Math.round(intensity * 90);
  const offset = ARC_LENGTH * (1 - Math.max(progress, days > 0 ? 0.02 : 0));

  useGSAP(
    () => {
      const arc = arcRef.current;
      if (!arc) {
        return;
      }

      if (reduced !== false || !ready) {
        gsap.set(arc, { strokeDashoffset: reduced ? offset : ARC_LENGTH });
        return;
      }

      gsap.fromTo(
        arc,
        { strokeDashoffset: ARC_LENGTH },
        { strokeDashoffset: offset, duration: 1.8, delay: 0.6, ease: "power3.out" },
      );
    },
    { dependencies: [ready, reduced, offset] },
  );

  return (
    <div
      aria-hidden="true"
      className="relative flex aspect-square w-[min(42vmin,280px)] shrink-0 items-center justify-center"
    >
      {live && reduced !== true ? (
        <>
          <span className="pulse-ring border-data-streak/40 absolute inset-[10%] rounded-full border" />
          <span
            className="pulse-ring border-data-streak/30 absolute inset-[10%] rounded-full border"
            style={{ animationDelay: "1.4s" }}
          />
        </>
      ) : null}

      {/* Current run against the record, drawn as an arc around the orb. */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx={50}
          cy={50}
          r={ARC_RADIUS}
          fill="none"
          stroke="var(--color-edge)"
          strokeWidth={1.5}
        />
        <circle
          ref={arcRef}
          cx={50}
          cy={50}
          r={ARC_RADIUS}
          fill="none"
          stroke="var(--color-data-streak)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH}
        />
      </svg>

      <div
        className={cx(
          "absolute inset-[18%] rounded-full",
          live && reduced !== true && "breathe",
        )}
        style={{
          background: live
            ? "radial-gradient(circle at 35% 30%, #ffd98a, var(--color-data-streak) 40%, #b86a00 80%, #5a3000)"
            : "radial-gradient(circle at 35% 30%, #4a4a4a, #262626 70%)",
          boxShadow: live
            ? `0 0 ${glow}px ${glow / 4}px color-mix(in srgb, var(--color-data-streak) 35%, transparent)`
            : undefined,
        }}
      />

      <div className="relative flex flex-col items-center">
        <span
          className={cx(
            "text-hero tabular font-extrabold leading-none",
            live ? "text-surface" : "text-ink-muted",
          )}
        >
          <CountUp amount={days} kind="integer" start={ready} delay={0.4} duration={1.4} punch={false} />
        </span>
        <span
          className={cx(
            "text-small mt-1 tracking-[0.3em] uppercase",
            live ? "text-surface/80" : "text-ink-faint",
          )}
        >
          {days === 1 ? "day" : "days"}
        </span>
      </div>
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
  const { ready } = useScene();
  const status = statusCopy(streak);
  const live = streak.current > 0 && !streak.isBroken;
  const progress =
    streak.longest > 0 ? Math.min(1, streak.current / streak.longest) : 0;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
      <SceneItem from="scale" delay={0.2} className="justify-self-center">
        <StreakOrb days={streak.current} live={live} progress={progress} ready={ready} />
      </SceneItem>

      <div className="grid gap-6 sm:grid-cols-2">
        <SceneItem delay={0.5} from="right" className="sm:col-span-2">
          <TiltCard className="p-5 sm:p-8 lg:p-10" intensity={5}>
            <p className="text-ink-faint text-small mb-3 tracking-[0.3em] uppercase">
              Current streak
            </p>
            <p className="text-heading text-ink font-semibold">{status.title}</p>
            <p className="text-ink-muted text-lead mt-3 max-w-lg">{status.body}</p>
            {streak.atRisk ? (
              <p className="text-warn text-base mt-5 flex items-center gap-3">
                <span aria-hidden="true" className="bg-warn breathe h-2.5 w-2.5 rounded-full shadow-[0_0_12px_var(--color-warn)]" />
                Expires at the end of today
              </p>
            ) : null}
          </TiltCard>
        </SceneItem>

        <SceneItem delay={0.7} from="right" className="sm:col-span-2">
          <TiltCard className="flex flex-col justify-between p-5 sm:p-8 lg:p-10" intensity={5} glow>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-ink-faint text-small mb-3 tracking-[0.3em] uppercase">
                  Longest streak
                </p>
                <p className="text-hero text-data-streak tabular font-extrabold leading-none">
                  <CountUp amount={streak.longest} kind="integer" start={ready} delay={0.9} duration={1.6} />
                  <span className="text-title text-ink-faint ml-3 font-normal">days</span>
                </p>
              </div>
              <p className="text-ink-faint text-small tracking-[0.12em] uppercase">
                {streak.longest === 0
                  ? "No record yet"
                  : `${streak.current} of ${streak.longest} · record on the books`}
              </p>
            </div>

            <div
              className="bg-edge mt-8 h-2 overflow-hidden rounded-full"
              role="img"
              aria-label={`Current streak is ${streak.current} of the ${streak.longest} day record`}
            >
              <GsapFill
                play={ready}
                duration={1.6}
                delay={1}
                className="bg-data-streak h-full rounded-full shadow-[0_0_14px_var(--color-data-streak)]"
                style={{ width: `${Math.max(progress * 100, streak.current > 0 ? 2 : 0)}%` }}
              />
            </div>
          </TiltCard>
        </SceneItem>
      </div>
    </div>
  );
}
