"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { DailyTokens } from "@/lib/cursor-profile";
import { formatCompactNumber, formatDayLabel } from "@/lib/derive";
import { tokenChartY } from "@/lib/tokens";
import { useIsClient } from "@/lib/use-is-client";
import { SceneItem, useScene } from "@/components/profile/scene";
import { GsapSwap } from "@/components/fx/gsap-swap";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 340;
const PAD = { top: 28, right: 20, bottom: 36, left: 20 };
const DRAW_SECONDS = 2.2;

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
      ` ${points[index + 1].x - third} ${points[index + 1].y + tangents[index + 1] * third}` +
      ` ${points[index + 1].x} ${points[index + 1].y}`;
  }

  return path;
}

export function TokenStream({
  series,
  total,
}: {
  series: DailyTokens[];
  total: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const cometRef = useRef<SVGCircleElement>(null);
  const peakRef = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();
  const { ready } = useScene();
  // Without this the server renders the line fully drawn, so the chart is present
  // until JavaScript arrives.
  const animated = useIsClient() && reduced === false;
  const drawn = !animated || ready;

  const { points, linePath, areaPath, max, peakIndex } = useMemo(() => {
    const innerWidth = VIEW_WIDTH - PAD.left - PAD.right;
    const innerHeight = VIEW_HEIGHT - PAD.top - PAD.bottom;
    const peak = series.reduce((best, entry) => Math.max(best, entry.tokens), 0);
    const minPositive = series.reduce(
      (best, entry) =>
        entry.tokens > 0 && (best === 0 || entry.tokens < best)
          ? entry.tokens
          : best,
      0,
    );
    const step = series.length > 1 ? innerWidth / (series.length - 1) : 0;

    const mapped: Point[] = series.map((entry, index) => ({
      x: PAD.left + index * step,
      y:
        PAD.top +
        innerHeight * (1 - tokenChartY(entry.tokens, peak, minPositive)),
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
      peakIndex: series.findIndex((entry) => entry.tokens === peak),
    };
  }, [series]);

  useGSAP(
    () => {
      const line = lineRef.current;
      const area = areaRef.current;
      const comet = cometRef.current;
      const peak = peakRef.current;

      if (!line || !linePath) {
        return;
      }

      const length = line.getTotalLength();

      if (!animated || !ready) {
        gsap.set(line, {
          strokeDasharray: length,
          strokeDashoffset: animated ? length : 0,
        });
        if (area) {
          gsap.set(area, { opacity: animated ? 0 : 1 });
        }
        if (comet) {
          gsap.set(comet, { opacity: 0 });
        }
        return;
      }

      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(line, {
        strokeDashoffset: 0,
        duration: DRAW_SECONDS,
        delay: 0.3,
        ease: "power3.out",
      });

      if (area) {
        gsap.fromTo(
          area,
          { opacity: 0 },
          { opacity: 1, duration: 1.2, delay: DRAW_SECONDS * 0.6 + 0.3, ease: "power2.out" },
        );
      }

      if (comet) {
        gsap.set(comet, { opacity: 0 });
        gsap.to(comet, {
          opacity: 1,
          duration: 0.2,
          delay: 0.3,
        });
        gsap.to(comet, {
          duration: DRAW_SECONDS,
          delay: 0.3,
          ease: "power3.out",
          motionPath: {
            path: line,
            align: line,
            alignOrigin: [0.5, 0.5],
            autoRotate: false,
          },
        });
        gsap.to(comet, {
          opacity: 0,
          duration: 0.3,
          delay: DRAW_SECONDS + 0.1,
        });
      }

      if (peak) {
        gsap.fromTo(
          peak,
          { opacity: 0, scale: 0 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.55,
            delay: DRAW_SECONDS + 0.3,
            ease: "back.out(1.7)",
            transformOrigin: "50% 50%",
          },
        );
      }
    },
    { dependencies: [animated, ready, linePath] },
  );

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
      event.stopPropagation();
      setActiveIndex((current) => {
        const next = (current ?? series.length - 1) + delta;
        return Math.min(series.length - 1, Math.max(0, next));
      });
    },
    [series.length],
  );

  if (series.length === 0) {
    return (
      <SceneItem>
        <p className="text-ink-faint text-lead py-12 text-center">
          No token activity in the last 30 days.
        </p>
      </SceneItem>
    );
  }

  const active = activeIndex === null ? null : points[activeIndex];
  const readout = active?.entry ?? { date: series.at(-1)!.date, tokens: total };
  const peak = peakIndex >= 0 ? points[peakIndex] : null;
  const readoutKey = active ? active.entry.date : "total";
  const readoutValue = active
    ? formatCompactNumber(active.entry.tokens)
    : formatCompactNumber(total);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(200px,280px)_1fr] lg:items-center lg:gap-10">
      <SceneItem delay={0.3} from="left">
        <div className="glass rounded-3xl p-5 sm:p-8">
          <p className="text-ink-faint text-small mb-3 tracking-[0.3em] uppercase">
            {active ? formatDayLabel(active.entry.date) : "Last 30 days"}
          </p>
          <GsapSwap id={readoutKey}>
            <p className="text-hero text-accent tabular font-extrabold leading-none">
              {readoutValue}
            </p>
          </GsapSwap>
          <p className="text-ink-muted text-base mt-3" aria-live="polite">
            {active
              ? `${formatCompactNumber(active.entry.tokens)} tokens on ${formatDayLabel(active.entry.date)}`
              : "tokens over the last 30 days"}
          </p>
          <p className="text-ink-faint text-small mt-6">
            Peak <span className="text-ink tabular">{formatCompactNumber(max)}</span>
            {peak ? ` on ${formatDayLabel(peak.entry.date)}` : ""}
          </p>
        </div>
      </SceneItem>

      <SceneItem delay={0.45}>
        <div className="glass relative rounded-3xl p-4 sm:p-6">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="h-auto w-full touch-none overflow-visible"
            role="img"
            aria-label={`Daily token usage for the last 30 days, peaking at ${formatCompactNumber(max)} tokens on ${formatDayLabel(readout.date)}`}
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
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="token-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-accent-deep)" />
                <stop offset="60%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="var(--color-ember)" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((fraction) => {
              const y = PAD.top + (VIEW_HEIGHT - PAD.top - PAD.bottom) * fraction;
              return (
                <line
                  key={fraction}
                  x1={PAD.left}
                  x2={VIEW_WIDTH - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="var(--color-edge)"
                  strokeWidth={1}
                  strokeDasharray="2 6"
                />
              );
            })}

            <path ref={areaRef} d={areaPath} fill="url(#token-fill)" opacity={drawn && !animated ? 1 : 0} />
            <path
              ref={lineRef}
              d={linePath}
              fill="none"
              stroke="url(#token-stroke)"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {animated ? (
              <circle
                ref={cometRef}
                r={7}
                fill="var(--color-ember)"
                opacity={0}
              />
            ) : null}

            {peak && drawn ? (
              <g ref={peakRef} style={{ transformOrigin: `${peak.x}px ${peak.y}px` }}>
                <circle cx={peak.x} cy={peak.y} r={10} fill="var(--color-ember)" opacity={0.25} />
                <circle cx={peak.x} cy={peak.y} r={5} fill="var(--color-ember)" />
              </g>
            ) : null}

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
                  r={9}
                  fill="var(--color-surface)"
                  stroke="var(--color-accent)"
                  strokeWidth={3}
                />
              </g>
            ) : null}
          </svg>

          <div className="text-ink-faint text-micro mt-2 flex justify-between px-1 tracking-[0.12em] uppercase">
            <span>{formatDayLabel(series[0].date)}</span>
            <span>{formatDayLabel(series[series.length - 1].date)}</span>
          </div>
        </div>
      </SceneItem>
    </div>
  );
}
