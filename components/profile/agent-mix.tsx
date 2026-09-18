"use client";

import { useState } from "react";
import type { AgentTotals } from "@/lib/derive";
import { formatDayLabel } from "@/lib/derive";
import { cx } from "@/lib/cx";

type Slice = "local" | "cloud";

const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Keeps the two arcs from reading as a single continuous ring once the round caps meet. */
const ARC_GAP = 18;

export function AgentMix({ agents }: { agents: AgentTotals }) {
  const [hovered, setHovered] = useState<Slice | null>(null);

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

  return (
    <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
      <div className="flex items-center gap-8">
        <div className="relative h-[196px] w-[196px] shrink-0">
          <svg viewBox="0 0 196 196" className="h-full w-full -rotate-90">
            <circle
              cx={98}
              cy={98}
              r={RADIUS}
              fill="none"
              stroke="var(--color-edge)"
              strokeWidth={14}
            />
            {/* Round caps on a zero-length arc still paint a stray dot. */}
            <circle
              cx={98}
              cy={98}
              r={RADIUS}
              fill="none"
              stroke="var(--color-data-local)"
              visibility={agents.local > 0 ? "visible" : "hidden"}
              strokeWidth={hovered === "local" ? 24 : 14}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, CIRCUMFERENCE * agents.localShare - ARC_GAP)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-ARC_GAP / 2}
              opacity={hovered === "cloud" ? 0.28 : 1}
              className="transition-all duration-300 ease-out"
            />
            <circle
              cx={98}
              cy={98}
              r={RADIUS}
              fill="none"
              stroke="var(--color-data-cloud)"
              visibility={agents.cloud > 0 ? "visible" : "hidden"}
              strokeWidth={hovered === "cloud" ? 24 : 14}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, CIRCUMFERENCE * agents.cloudShare - ARC_GAP)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-(CIRCUMFERENCE * agents.localShare + ARC_GAP / 2)}
              opacity={hovered === "local" ? 0.28 : 1}
              className="transition-all duration-300 ease-out"
            />
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-display tabular text-ink leading-none">
              {centre.value}
            </span>
            <span className="text-ink-faint text-micro mt-2 tracking-[0.16em] uppercase">
              {centre.label}
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {(
            [
              { slice: "local" as const, value: agents.local, colour: "bg-data-local" },
              { slice: "cloud" as const, value: agents.cloud, colour: "bg-data-cloud" },
            ]
          ).map(({ slice, value, colour }) => (
            <li key={slice}>
              <button
                type="button"
                onMouseEnter={() => setHovered(slice)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(slice)}
                onBlur={() => setHovered(null)}
                className={cx(
                  "focus-visible:ring-ink flex items-center gap-3 rounded-lg px-2 py-1 text-left transition-opacity outline-none focus-visible:ring-2",
                  hovered && hovered !== slice && "opacity-50",
                )}
              >
                <span className={cx("h-2.5 w-2.5 rounded-full", colour)} />
                <span className="text-ink text-base capitalize">{slice}</span>
                <span className="text-ink-faint text-small tabular whitespace-nowrap">
                  {value} ·{" "}
                  {Math.round(
                    (slice === "local" ? agents.localShare : agents.cloudShare) *
                      100,
                  )}
                  %
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-ink-faint text-micro mb-4 tracking-[0.22em] uppercase">
          Last 30 days
        </p>
        <div className="flex h-24 items-end gap-[3px]">
          {agents.series.map((day) => {
            const total = day.local + day.cloud;
            const height = peakDay > 0 ? (total / peakDay) * 100 : 0;

            return (
              <div
                key={day.date}
                // Capped so a short series renders as bars rather than ballooning
                // into full-width blocks.
                className="group relative flex h-full max-w-[18px] flex-1 flex-col justify-end"
                title={`${formatDayLabel(day.date)}: ${day.local} local, ${day.cloud} cloud`}
              >
                <div
                  className="flex w-full flex-col-reverse overflow-hidden rounded-[2px]"
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
        <p className="text-ink-faint text-micro mt-3">
          {agents.windowTotal} {agents.windowTotal === 1 ? "run" : "runs"} in the
          charted window.
          {agents.windowTotal === agents.total
            ? null
            : " The headline total covers all tracked history, so the two differ."}
        </p>
      </div>
    </div>
  );
}
