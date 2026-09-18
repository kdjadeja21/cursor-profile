"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { DailyTokens } from "@/lib/cursor-profile";
import {
  formatCompactNumber,
  formatDayLabel,
  formatFullNumber,
} from "@/lib/derive";
import { cx } from "@/lib/cx";

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 300;
const PAD = { top: 24, right: 16, bottom: 32, left: 16 };

type Point = { x: number; y: number; entry: DailyTokens };

/**
 * Monotone cubic (Fritsch-Carlson) rather than Catmull-Rom: a plain spline overshoots
 * between spikes and dips the curve below zero, which would draw token counts that
 * never happened.
 */
function toSmoothPath(points: Point[]): string {
  const count = points.length;

  if (count === 0) {
    return "";
  }

  if (count < 3) {
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join(" ");
  }

  const dx: number[] = [];
  const slopes: number[] = [];

  for (let index = 0; index < count - 1; index += 1) {
    dx[index] = points[index + 1].x - points[index].x;
    slopes[index] = (points[index + 1].y - points[index].y) / dx[index];
  }

  const tangents = new Array<number>(count);
  tangents[0] = slopes[0];
  tangents[count - 1] = slopes[count - 2];

  for (let index = 1; index < count - 1; index += 1) {
    if (slopes[index - 1] * slopes[index] <= 0) {
      tangents[index] = 0;
      continue;
    }

    const left = 2 * dx[index] + dx[index - 1];
    const right = dx[index] + 2 * dx[index - 1];
    tangents[index] =
      (left + right) / (left / slopes[index - 1] + right / slopes[index]);
  }

  let path = `M${points[0].x} ${points[0].y}`;

  for (let index = 0; index < count - 1; index += 1) {
    const third = dx[index] / 3;
    path +=
      ` C${points[index].x + third} ${points[index].y + tangents[index] * third}` +
      ` ${points[index + 1].x - third} ${points[index + 1].y - tangents[index + 1] * third}` +
      ` ${points[index + 1].x} ${points[index + 1].y}`;
  }

  return path;
}

export function TokenStream({
  series,
  total,
  animate = false,
}: {
  series: DailyTokens[];
  total: number;
  animate?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { points, linePath, areaPath, max } = useMemo(() => {
    const innerWidth = VIEW_WIDTH - PAD.left - PAD.right;
    const innerHeight = VIEW_HEIGHT - PAD.top - PAD.bottom;
    const peak = series.reduce((best, entry) => Math.max(best, entry.tokens), 0);
    const scale = peak > 0 ? peak : 1;
    const step = series.length > 1 ? innerWidth / (series.length - 1) : 0;

    const mapped: Point[] = series.map((entry, index) => ({
      x: PAD.left + index * step,
      y: PAD.top + innerHeight * (1 - entry.tokens / scale),
      entry,
    }));

    const line = toSmoothPath(mapped);
    const baseline = PAD.top + innerHeight;

    return {
      points: mapped,
      linePath: line,
      areaPath: line
        ? `${line} L${mapped[mapped.length - 1].x} ${baseline} L${mapped[0].x} ${baseline} Z`
        : "",
      max: peak,
    };
  }, [series]);

  const pickIndex = useCallback(
    (clientX: number) => {
      const bounds = svgRef.current?.getBoundingClientRect();
      if (!bounds || bounds.width === 0 || series.length === 0) {
        return;
      }

      const ratio = (clientX - bounds.left) / bounds.width;
      const viewX = ratio * VIEW_WIDTH;
      const innerWidth = VIEW_WIDTH - PAD.left - PAD.right;
      const step = series.length > 1 ? innerWidth / (series.length - 1) : 1;
      const index = Math.round((viewX - PAD.left) / step);

      setActiveIndex(Math.min(series.length - 1, Math.max(0, index)));
    },
    [series.length],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const delta =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

      if (delta === 0) {
        return;
      }

      event.preventDefault();
      setActiveIndex((current) => {
        const next = (current ?? series.length - 1) + delta;
        return Math.min(series.length - 1, Math.max(0, next));
      });
    },
    [series.length],
  );

  if (series.length === 0) {
    return (
      <p className="text-ink-faint text-small py-12 text-center">
        No token activity in the last 30 days.
      </p>
    );
  }

  const active = activeIndex === null ? null : points[activeIndex];
  const readout = active?.entry ?? { date: series.at(-1)!.date, tokens: total };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-display tabular text-ink">
          {active
            ? formatCompactNumber(active.entry.tokens)
            : formatCompactNumber(total)}
        </p>
        <p className="text-ink-muted text-small" aria-live="polite">
          {active
            ? `${formatFullNumber(active.entry.tokens)} tokens on ${formatDayLabel(active.entry.date)}`
            : "tokens over the last 30 days"}
        </p>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-label={`Daily token usage for the last 30 days, peaking at ${formatFullNumber(max)} tokens on ${formatDayLabel(readout.date)}`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerMove={(event) => pickIndex(event.clientX)}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            pickIndex(event.clientX);
          }}
          onPointerLeave={() => setActiveIndex(null)}
          onBlur={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="token-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.36" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((fraction) => {
            const y =
              PAD.top + (VIEW_HEIGHT - PAD.top - PAD.bottom) * fraction;
            return (
              <line
                key={fraction}
                x1={PAD.left}
                x2={VIEW_WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--color-edge)"
                strokeWidth={1}
              />
            );
          })}

          <path d={areaPath} fill="url(#token-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cx(animate && "motion-safe:[stroke-dasharray:4000] motion-safe:[animation:draw-in_1.6s_cubic-bezier(0.22,1,0.36,1)_forwards]")}
          />

          {active ? (
            <g>
              <line
                x1={active.x}
                x2={active.x}
                y1={PAD.top}
                y2={VIEW_HEIGHT - PAD.bottom}
                stroke="var(--color-edge-strong)"
                strokeWidth={1}
              />
              <circle
                cx={active.x}
                cy={active.y}
                r={6}
                fill="var(--color-surface)"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
              />
            </g>
          ) : null}
        </svg>

        <div className="text-ink-faint text-micro mt-1 flex justify-between">
          <span>{formatDayLabel(series[0].date)}</span>
          <span className="hidden sm:inline">
            peak {formatCompactNumber(max)}
          </span>
          <span>{formatDayLabel(series[series.length - 1].date)}</span>
        </div>
      </div>
    </div>
  );
}
