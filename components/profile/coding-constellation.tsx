"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { Calendar, CalendarCell } from "@/lib/derive";
import { useIsClient } from "@/lib/use-is-client";
import {
  formatCompactNumber,
  formatDayLabel,
  formatFullNumber,
} from "@/lib/derive";
import { cx } from "@/lib/cx";

const LEVEL_CLASS: Record<CalendarCell["level"], string> = {
  0: "bg-white/[0.04]",
  1: "bg-accent/20",
  2: "bg-accent/40",
  3: "bg-accent/65",
  4: "bg-accent shadow-[0_0_12px_-2px_var(--color-accent)]",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cellLabel(cell: CalendarCell): string {
  if (!cell.inRange) {
    return `${formatDayLabel(cell.date)}, outside tracked history`;
  }

  return cell.tokens > 0
    ? `${formatDayLabel(cell.date)}, ${formatFullNumber(cell.tokens)} tokens`
    : `${formatDayLabel(cell.date)}, no activity`;
}

export function CodingConstellation({ calendar }: { calendar: Calendar }) {
  const [focus, setFocus] = useState({ week: calendar.weeks.length - 1, day: 6 });
  const [active, setActive] = useState<CalendarCell | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const reduced = useReducedMotion();
  const inView = useInView(gridRef, { once: true, margin: "-80px" });

  // Cells are only hidden ahead of the wave once JS has taken over, so the
  // server-rendered grid and the reduced-motion path both stay fully visible.
  const armed = useIsClient() && !reduced;
  const waving = armed && inView;
  const hidden = armed && !inView;

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

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[520px] gap-2">
          <div
            aria-hidden="true"
            className="text-ink-faint text-micro grid shrink-0 grid-rows-7 gap-[3px] pt-5"
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
              className="text-ink-faint text-micro mb-1 grid h-4 gap-[3px]"
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
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: columns }}
            >
              {/* Row-major so the grid can size its columns fluidly to the container. */}
              {WEEKDAYS.map((_, dayIndex) =>
                calendar.weeks.map((week, weekIndex) => {
                  const cell = week[dayIndex];
                  const isFocusTarget =
                    focus.week === weekIndex && focus.day === dayIndex;

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
                        "focus-visible:ring-ink aspect-square rounded-[3px] transition-transform duration-150 outline-none hover:scale-110 focus-visible:ring-2",
                        cell.inRange ? LEVEL_CLASS[cell.level] : "bg-white/[0.02]",
                        hidden && "opacity-0",
                        waving && "animate-[fade-in_0.45s_ease-out_backwards]",
                      )}
                      style={
                        waving
                          ? {
                              animationDelay: `${weekIndex * 26 + dayIndex * 8}ms`,
                            }
                          : undefined
                      }
                    />
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p
          aria-live="polite"
          className="text-ink-muted text-small min-h-[1.5em]"
        >
          {active ? (
            <>
              <span className="text-ink tabular">
                {active.inRange && active.tokens > 0
                  ? `${formatFullNumber(active.tokens)} tokens`
                  : "No activity"}
              </span>
              <span className="text-ink-faint"> · {formatDayLabel(active.date)}</span>
            </>
          ) : calendar.activeDays === 0 ? (
            "Nothing tracked yet — the first day lands here."
          ) : (
            <>
              {calendar.activeDays} active days of {calendar.trackedDays} tracked
              <span className="text-ink-faint"> · {consistency}% consistency</span>
            </>
          )}
        </p>

        <div
          aria-hidden="true"
          className="text-ink-faint text-micro flex items-center gap-2"
        >
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className={cx("h-3 w-3 rounded-[3px]", LEVEL_CLASS[level])}
            />
          ))}
          <span>More</span>
          {calendar.maxTokens > 0 ? (
            <span className="text-ink-faint/70 ml-2">
              up to {formatCompactNumber(calendar.maxTokens)}/day
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
