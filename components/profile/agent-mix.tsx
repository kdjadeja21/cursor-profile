"use client";

import { useRef, useState } from "react";
import {
  formatCompactNumber,
  formatDayLabel,
  formatFullNumber,
  type AgentTotals,
} from "@/lib/derive";
import { CountUp } from "@/components/profile/primitives/count-up";
import { SceneItem, useScene } from "@/components/profile/scene";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

type Slice = "local" | "cloud";

const VIEW = 200;
const CENTER = 100;
const STROKE = 12;
const HOVER_STROKE = 18;
const RADIUS = 82;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Keeps the two arcs from reading as a single continuous ring once the round caps meet. */
const ARC_GAP = 16;

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

function formatAgentCount(value: number): string {
  return value >= 1000 ? formatCompactNumber(value) : formatFullNumber(value);
}

export function AgentMix({ agents }: { agents: AgentTotals }) {
  const [hovered, setHovered] = useState<Slice | null>(null);
  const { ready } = useScene();
  const reduced = useReducedMotion();
  const localRef = useRef<SVGCircleElement>(null);
  const cloudRef = useRef<SVGCircleElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

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

  useGSAP(
    () => {
      const local = localRef.current;
      const cloud = cloudRef.current;

      if (reduced !== false || !ready) {
        if (reduced && local) {
          gsap.set(local, { strokeDasharray: `${localLength} ${CIRCUMFERENCE}` });
        }
        if (reduced && cloud) {
          gsap.set(cloud, { strokeDasharray: `${cloudLength} ${CIRCUMFERENCE}` });
        }
        return;
      }

      if (local) {
        gsap.fromTo(
          local,
          { strokeDasharray: `0 ${CIRCUMFERENCE}` },
          {
            strokeDasharray: `${localLength} ${CIRCUMFERENCE}`,
            duration: 1.6,
            delay: 0.5,
            ease: "power3.out",
          },
        );
      }

      if (cloud) {
        gsap.fromTo(
          cloud,
          { strokeDasharray: `0 ${CIRCUMFERENCE}` },
          {
            strokeDasharray: `${cloudLength} ${CIRCUMFERENCE}`,
            duration: 1.6,
            delay: 0.9,
            ease: "power3.out",
          },
        );
      }
    },
    { dependencies: [ready, reduced, localLength, cloudLength] },
  );

  useGSAP(
    () => {
      if (!ready) {
        return;
      }

      if (localRef.current) {
        gsap.to(localRef.current, {
          strokeWidth: hovered === "local" ? HOVER_STROKE : STROKE,
          opacity: hovered === "cloud" ? 0.28 : 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      if (cloudRef.current) {
        gsap.to(cloudRef.current, {
          strokeWidth: hovered === "cloud" ? HOVER_STROKE : STROKE,
          opacity: hovered === "local" ? 0.28 : 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    },
    { dependencies: [hovered, ready] },
  );

  useGSAP(
    () => {
      const root = barsRef.current;
      if (!root || reduced !== false || !ready) {
        return;
      }

      gsap.fromTo(
        root.querySelectorAll("[data-agent-bar]"),
        { scaleY: 0, opacity: 0 },
        {
          scaleY: 1,
          opacity: 1,
          duration: 0.7,
          stagger: 0.035,
          delay: 1,
          ease: "power3.out",
          transformOrigin: "center bottom",
        },
      );
    },
    { dependencies: [ready, reduced] },
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
      <div className="flex flex-col items-center gap-10 sm:flex-row sm:gap-12">
        <SceneItem from="scale" delay={0.2}>
          <div className="relative size-[min(52vmin,17.5rem)] shrink-0">
            <svg
              viewBox={`0 0 ${VIEW} ${VIEW}`}
              className="h-full w-full -rotate-90 overflow-visible"
            >
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="var(--color-edge)"
                strokeWidth={STROKE}
              />
              {/* Round caps on a zero-length arc still paint a stray dot. */}
              <circle
                ref={localRef}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="var(--color-data-local)"
                visibility={agents.local > 0 ? "visible" : "hidden"}
                strokeLinecap="round"
                strokeWidth={STROKE}
                strokeDashoffset={-ARC_GAP / 2}
                strokeDasharray={`0 ${CIRCUMFERENCE}`}
              />
              <circle
                ref={cloudRef}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="var(--color-data-cloud)"
                visibility={agents.cloud > 0 ? "visible" : "hidden"}
                strokeLinecap="round"
                strokeWidth={STROKE}
                strokeDashoffset={-(CIRCUMFERENCE * agents.localShare + ARC_GAP / 2)}
                strokeDasharray={`0 ${CIRCUMFERENCE}`}
              />
            </svg>

            {/* Inset past the stroke so the count and label stay inside the hole. */}
            <div className="@container pointer-events-none absolute inset-[18%] flex flex-col items-center justify-center px-1 text-center">
              <span className="text-ink w-full tabular max-w-full font-extrabold leading-none tracking-tight text-[clamp(1.15rem,32cqi,2.35rem)]">
                {hovered ? (
                  formatAgentCount(centre.value)
                ) : (
                  <CountUp
                    amount={agents.total}
                    kind={agents.total >= 1000 ? "compact" : "integer"}
                    start={ready}
                    delay={0.6}
                    duration={1.8}
                    punch={false}
                  />
                )}
              </span>
              <span className="text-ink-faint mt-1.5 max-w-full leading-tight tracking-[0.14em] uppercase text-[clamp(0.5rem,10.5cqi,0.68rem)]">
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
                      {formatAgentCount(value)} · {Math.round(share * 100)}%
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
          <div ref={barsRef} className="flex h-28 items-end gap-[3px] sm:h-40 sm:gap-[4px]">
            {agents.series.map((day) => {
              const total = day.local + day.cloud;
              const height = peakDay > 0 ? (total / peakDay) * 100 : 0;

              return (
                <div
                  key={day.date}
                  // Capped so a short series renders as bars rather than ballooning
                  // into full-width blocks.
                  className="group relative flex h-full max-w-[28px] flex-1 flex-col justify-end"
                  title={`${formatDayLabel(day.date)}: ${formatAgentCount(day.local)} local, ${formatAgentCount(day.cloud)} cloud`}
                >
                  <div
                    data-agent-bar=""
                    className="flex w-full origin-bottom flex-col-reverse overflow-hidden rounded-[3px]"
                    style={{ height: `${Math.max(height, total > 0 ? 6 : 2)}%` }}
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
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-ink-faint text-base mt-5">
            {formatAgentCount(agents.windowTotal)}{" "}
            {agents.windowTotal === 1 ? "run" : "runs"} in the
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
