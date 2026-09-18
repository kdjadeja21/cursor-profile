"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { AgentTotals } from "@/lib/derive";
import { formatDayLabel } from "@/lib/derive";
import { CountUp } from "@/components/profile/primitives/count-up";
import { SceneItem, useScene } from "@/components/profile/scene";
import { cx } from "@/lib/cx";

type Slice = "local" | "cloud";

const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Keeps the two arcs from reading as a single continuous ring once the round caps meet. */
const ARC_GAP = 18;

const SLICES: { slice: Slice; colour: string; dot: string; glow: string }[] = [
  {
    slice: "local",
    colour: "var(--color-data-local)",
    dot: "bg-data-local",
    glow: "shadow-[0_0_14px_var(--color-data-local)]",
  },
  {
    slice: "cloud",
    colour: "var(--color-data-cloud)",
    dot: "bg-data-cloud",
    glow: "shadow-[0_0_14px_var(--color-data-cloud)]",
  },
];

export function AgentMix({ agents }: { agents: AgentTotals }) {
  const [hovered, setHovered] = useState<Slice | null>(null);
  const { ready } = useScene();
  const reduced = useReducedMotion();

  const centre =
    hovered === "local"
      ? { value: agents.local, label: "Local agents" }
      : hovered === "cloud"
        ? { value: agents.cloud, label: "Cloud agents" }
        : { value: agents.total, label: "Agents run" };

  const peakDay = agents.series.reduce(
    (best, entry) =>
      entry.local + entry.cloud > best ? entry.local + entry.cloud : best,
    0,
  );

  const localLength = Math.max(0, CIRCUMFERENCE * agents.localShare - ARC_GAP);
  const cloudLength = Math.max(0, CIRCUMFERENCE * agents.cloudShare - ARC_GAP);

  return (
    <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
      <div className="flex flex-col items-center gap-10 sm:flex-row sm:gap-12">
        <SceneItem from="scale" delay={0.2}>
          <div className="relative h-[min(42vmin,240px)] w-[min(42vmin,240px)] shrink-0">
            <svg viewBox="0 0 196 196" className="h-full w-full -rotate-90 overflow-visible">
              <defs>
                <filter id="agent-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx={98}
                cy={98}
                r={RADIUS}
                fill="none"
                stroke="var(--color-edge)"
                strokeWidth={14}
              />
              {/* Round caps on a zero-length arc still paint a stray dot. */}
              <motion.circle
                cx={98}
                cy={98}
                r={RADIUS}
                fill="none"
                stroke="var(--color-data-local)"
                visibility={agents.local > 0 ? "visible" : "hidden"}
                strokeLinecap="round"
                strokeDashoffset={-ARC_GAP / 2}
                filter="url(#agent-glow)"
                initial={reduced ? false : { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeWidth: 14 }}
                animate={
                  ready
                    ? {
                        strokeDasharray: `${localLength} ${CIRCUMFERENCE}`,
                        strokeWidth: hovered === "local" ? 24 : 14,
                        opacity: hovered === "cloud" ? 0.28 : 1,
                      }
                    : undefined
                }
                transition={{
                  strokeDasharray: { duration: 1.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] },
                  default: { duration: 0.3 },
                }}
              />
              <motion.circle
                cx={98}
                cy={98}
                r={RADIUS}
                fill="none"
                stroke="var(--color-data-cloud)"
                visibility={agents.cloud > 0 ? "visible" : "hidden"}
                strokeLinecap="round"
                strokeDashoffset={-(CIRCUMFERENCE * agents.localShare + ARC_GAP / 2)}
                filter="url(#agent-glow)"
                initial={reduced ? false : { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeWidth: 14 }}
                animate={
                  ready
                    ? {
                        strokeDasharray: `${cloudLength} ${CIRCUMFERENCE}`,
                        strokeWidth: hovered === "cloud" ? 24 : 14,
                        opacity: hovered === "local" ? 0.28 : 1,
                      }
                    : undefined
                }
                transition={{
                  strokeDasharray: { duration: 1.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] },
                  default: { duration: 0.3 },
                }}
              />
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-hero text-ink tabular font-extrabold leading-none">
                {hovered ? (
                  centre.value
                ) : (
                  <CountUp amount={agents.total} kind="integer" start={ready} delay={0.6} duration={1.8} />
                )}
              </span>
              <span className="text-ink-faint text-small mt-3 tracking-[0.3em] uppercase">
                {centre.label}
              </span>
            </div>
          </div>
        </SceneItem>

        <ul className="flex flex-col gap-4">
          {SLICES.map(({ slice, dot, glow }, index) => {
            const value = slice === "local" ? agents.local : agents.cloud;
            const share = slice === "local" ? agents.localShare : agents.cloudShare;
            return (
              <li key={slice}>
                <SceneItem delay={0.7 + index * 0.15} from="left">
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(slice)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(slice)}
                    onBlur={() => setHovered(null)}
                    className={cx(
                      "glass focus-visible:ring-ink flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-[opacity,transform] duration-300 outline-none hover:scale-[1.03] focus-visible:ring-2",
                      hovered && hovered !== slice && "opacity-50",
                    )}
                  >
                    <span className={cx("h-3.5 w-3.5 rounded-full", dot, glow)} />
                    <span className="text-title text-ink font-semibold capitalize">{slice}</span>
                    <span className="text-ink-faint text-base tabular whitespace-nowrap">
                      {value} · {Math.round(share * 100)}%
                    </span>
                  </button>
                </SceneItem>
              </li>
            );
          })}
        </ul>
      </div>

      <SceneItem delay={0.9} from="right">
        <div className="glass rounded-3xl p-5 sm:p-8">
          <p className="text-ink-faint text-small mb-6 tracking-[0.3em] uppercase">
            Last 30 days
          </p>
          <div className="flex h-28 items-end gap-[3px] sm:h-40 sm:gap-[4px]">
            {agents.series.map((day, index) => {
              const total = day.local + day.cloud;
              const height = peakDay > 0 ? (total / peakDay) * 100 : 0;

              return (
                <div
                  key={day.date}
                  // Capped so a short series renders as bars rather than ballooning
                  // into full-width blocks.
                  className="group relative flex h-full max-w-[28px] flex-1 flex-col justify-end"
                  title={`${formatDayLabel(day.date)}: ${day.local} local, ${day.cloud} cloud`}
                >
                  <motion.div
                    className="flex w-full origin-bottom flex-col-reverse overflow-hidden rounded-[3px]"
                    style={{ height: `${Math.max(height, total > 0 ? 6 : 2)}%` }}
                    initial={reduced ? false : { scaleY: 0, opacity: 0 }}
                    animate={ready ? { scaleY: 1, opacity: 1 } : undefined}
                    transition={{
                      duration: 0.7,
                      delay: 1 + index * 0.035,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <div
                      className={cx(
                        "bg-data-local w-full transition-opacity",
                        hovered === "cloud" && "opacity-25",
                      )}
                      style={{ flexGrow: day.local }}
                    />
                    <div
                      className={cx(
                        "bg-data-cloud w-full transition-opacity",
                        hovered === "local" && "opacity-25",
                      )}
                      style={{ flexGrow: day.cloud }}
                    />
                    {total === 0 ? <div className="bg-edge h-full w-full" /> : null}
                  </motion.div>
                </div>
              );
            })}
          </div>
          <p className="text-ink-faint text-base mt-5">
            {agents.windowTotal} {agents.windowTotal === 1 ? "run" : "runs"} in the
            charted window.
            {agents.windowTotal === agents.total
              ? null
              : " The headline total covers all tracked history, so the two differ."}
          </p>
        </div>
      </SceneItem>
    </div>
  );
}
