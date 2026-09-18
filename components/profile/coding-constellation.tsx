"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Calendar, CalendarCell } from "@/lib/derive";
import { useIsClient } from "@/lib/use-is-client";
import { formatCompactNumber, formatDayLabel } from "@/lib/derive";
import { SceneItem, useScene } from "@/components/profile/scene";
import { GsapSwap } from "@/components/fx/gsap-swap";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

const LEVEL_CLASS: Record<CalendarCell["level"], string> = {
  0: "bg-white/[0.05]",
  1: "bg-accent/25",
  2: "bg-accent/50",
  3: "bg-accent/80 shadow-[0_0_10px_-2px_var(--color-accent)]",
  4: "bg-ember shadow-[0_0_18px_-2px_var(--color-ember)]",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cellLabel(cell: CalendarCell): string {
  if (!cell.inRange) {
    return `${formatDayLabel(cell.date)}, outside tracked history`;
  }

  return cell.tokens > 0
    ? `${formatDayLabel(cell.date)}, ${formatCompactNumber(cell.tokens)} tokens`
    : `${formatDayLabel(cell.date)}, no activity`;
}

export function CodingConstellation({ calendar }: { calendar: Calendar }) {
  const [focus, setFocus] = useState({ week: calendar.weeks.length - 1, day: 6 });
  const [active, setActive] = useState<CalendarCell | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const reduced = useReducedMotion();
  const { ready } = useScene();

  // Cells are only hidden ahead of the wave once JS has taken over, so the
  // server-rendered grid and the reduced-motion path both stay fully visible.
  const armed = useIsClient() && reduced === false;
  const waving = armed && ready;
  const hidden = armed && !ready;

  const totalWeeks = calendar.weeks.length;
  const columns = `repeat(${totalWeeks}, minmax(0, 1fr))`;

  // Roving tabindex: the grid is a single tab stop and arrows move within it. DOM focus
  // has to move after the render that reassigns tabIndex, not inside the state updater.
  const pendingFocus = useRef(false);

  const moveFocus = useCallback(
    (weekDelta: number, dayDelta: number) => {
      pendingFocus.current = true;
      setFocus((current) => ({
        week: Math.min(totalWeeks - 1, Math.max(0, current.week + weekDelta)),
        day: Math.min(6, Math.max(0, current.day + dayDelta)),
      }));
    },
    [totalWeeks],
  );

  useEffect(() => {
    if (!pendingFocus.current) {
      return;
    }

    pendingFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-cell="${focus.week}-${focus.day}"]`)
      ?.focus();
  }, [focus]);

  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid || !waving) {
        return;
      }

      const cells = grid.querySelectorAll("[data-cell]");
      gsap.fromTo(
        cells,
        { opacity: 0, scale: 0.45 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.45,
          stagger: { amount: 1.05, from: "start" },
          ease: "power2.out",
        },
      );
    },
    { dependencies: [waving] },
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const moves: Record<string, [number, number]> = {
        ArrowRight: [1, 0],
        ArrowLeft: [-1, 0],
        ArrowDown: [0, 1],
        ArrowUp: [0, -1],
      };

      const move = moves[event.key];
      if (!move) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      moveFocus(move[0], move[1]);
    },
    [moveFocus],
  );

  const consistency = useMemo(
    () =>
      calendar.trackedDays > 0
        ? Math.round((calendar.activeDays / calendar.trackedDays) * 100)
        : 0,
    [calendar.activeDays, calendar.trackedDays],
  );

  const peakDate = calendar.busiestDay?.date;
  const readoutId = active ? active.date : "summary";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(220px,300px)] lg:items-end lg:gap-10">
      <SceneItem delay={0.3} className="glass rounded-3xl p-4 sm:p-6 lg:p-8">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[520px] gap-2 sm:gap-3">
            <div
              aria-hidden="true"
              className="text-ink-faint text-micro grid shrink-0 grid-rows-7 gap-[5px] pt-6"
            >
              {WEEKDAYS.map((day, index) => (
                <div key={day} className="flex items-center pr-1 leading-none">
                  {index % 2 === 1 ? day : ""}
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <div
                aria-hidden="true"
                className="text-ink-faint text-micro mb-2 grid h-4 gap-[5px] tracking-[0.12em] uppercase"
                style={{ gridTemplateColumns: columns }}
              >
                {calendar.weeks.map((_, weekIndex) => {
                  const month = calendar.months.find(
                    (entry) => entry.weekIndex === weekIndex,
                  );

                  return (
                    <div key={weekIndex} className="relative">
                      {month ? (
                        <span className="absolute left-0 whitespace-nowrap">
                          {month.label}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div
                ref={gridRef}
                role="grid"
                aria-label="Daily token activity"
                onKeyDown={onKeyDown}
                onMouseLeave={() => setActive(null)}
                className="grid gap-[5px]"
                style={{ gridTemplateColumns: columns }}
              >
                {/* Row-major so the grid can size its columns fluidly to the container. */}
                {WEEKDAYS.map((_, dayIndex) =>
                  calendar.weeks.map((week, weekIndex) => {
                    const cell = week[dayIndex];
                    const isFocusTarget =
                      focus.week === weekIndex && focus.day === dayIndex;
                    const isPeak = cell.inRange && cell.date === peakDate;

                    return (
                      <div
                        key={cell.date}
                        role="gridcell"
                        data-cell={`${weekIndex}-${dayIndex}`}
                        tabIndex={isFocusTarget ? 0 : -1}
                        aria-label={cellLabel(cell)}
                        onFocus={() => {
                          setFocus({ week: weekIndex, day: dayIndex });
                          setActive(cell);
                        }}
                        onBlur={() => setActive(null)}
                        onMouseEnter={() => setActive(cell)}
                        className={cx(
                          "focus-visible:ring-ink relative aspect-square rounded-[4px] outline-none hover:z-10 hover:scale-125 focus-visible:ring-2",
                          cell.inRange ? LEVEL_CLASS[cell.level] : "bg-white/[0.02]",
                          hidden && "opacity-0",
                        )}
                      >
                        {cell.inRange && cell.level === 4 && reduced !== true ? (
                          // Twinkles fall out of sync so the grid shimmers rather than blinks.
                          <span
                            aria-hidden="true"
                            className="twinkle bg-ember absolute inset-0 rounded-[4px]"
                            style={{ animationDelay: `${((weekIndex * 7 + dayIndex) % 11) * 0.2}s` }}
                          />
                        ) : null}
                        {isPeak && reduced !== true ? (
                          <span
                            aria-hidden="true"
                            className="pulse-ring border-ember absolute inset-[-3px] rounded-full border-2"
                          />
                        ) : null}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="text-ink-faint text-micro mt-6 flex items-center gap-2 tracking-[0.12em] uppercase"
        >
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className={cx("h-3 w-3 rounded-[3px]", LEVEL_CLASS[level])}
            />
          ))}
          <span>More</span>
        </div>
      </SceneItem>

      <div className="flex flex-col gap-4">
        <SceneItem delay={0.6} from="right">
          <div className="glass relative min-h-[160px] overflow-hidden rounded-3xl p-7">
            <p className="text-ink-faint text-small mb-3 tracking-[0.3em] uppercase">
              {active ? "Selected day" : "Consistency"}
            </p>
            <GsapSwap id={readoutId}>
              <div aria-live="polite">
                {active ? (
                  <>
                    <p className="text-display text-ink tabular font-bold">
                      {active.inRange && active.tokens > 0
                        ? formatCompactNumber(active.tokens)
                        : "0"}
                      <span className="text-ink-faint text-lead ml-2 font-normal">tokens</span>
                    </p>
                    <p className="text-ink-muted text-base mt-1">
                      {formatDayLabel(active.date)}
                    </p>
                  </>
                ) : calendar.activeDays === 0 ? (
                  <p className="text-ink-muted text-lead">
                    Nothing tracked yet — the first day lands here.
                  </p>
                ) : (
                  <>
                    <p className="text-display text-ink tabular font-bold">
                      {consistency}
                      <span className="text-accent">%</span>
                    </p>
                    <p className="text-ink-muted text-base mt-1">
                      {calendar.activeDays} active of {calendar.trackedDays} tracked days
                    </p>
                  </>
                )}
              </div>
            </GsapSwap>
          </div>
        </SceneItem>

        {calendar.busiestDay ? (
          <SceneItem delay={0.75} from="right">
            <div className="glass border-ember/30 rounded-3xl p-7">
              <p className="text-ink-faint text-small mb-3 tracking-[0.3em] uppercase">
                Peak day
              </p>
              <p className="text-heading text-ember tabular font-bold">
                {formatCompactNumber(calendar.busiestDay.tokens)}
              </p>
              <p className="text-ink-muted text-base mt-1">
                {formatDayLabel(calendar.busiestDay.date)}
              </p>
            </div>
          </SceneItem>
        ) : null}
      </div>
    </div>
  );
}
