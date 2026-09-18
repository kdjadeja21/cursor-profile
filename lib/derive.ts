import type {
  DailyAgents,
  DailyTokens,
  ProfileActivity,
} from "@/lib/cursor-profile";

const MS_PER_DAY = 86_400_000;

export function parseIsoDate(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function toIsoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to) - parseIsoDate(from)) / MS_PER_DAY);
}

export function shiftDays(date: string, amount: number): string {
  return toIsoDate(parseIsoDate(date) + amount * MS_PER_DAY);
}

/**
 * Upstream's trailing windows always end on the current day, so "today" comes from
 * the payload rather than the clock. That keeps every derivation deterministic and
 * safe to compute inside a cached scope.
 */
export function resolveToday(activity: ProfileActivity): string {
  const lastWindowDay =
    activity.tokensOverTime.at(-1)?.date ?? activity.agentsOverTime.at(-1)?.date;

  return (
    lastWindowDay ??
    activity.activityCounts.at(-1)?.date ??
    activity.activeDates.at(-1) ??
    toIsoDate(Date.now())
  );
}

export function formatCompactNumber(value: number): string {
  const units = [
    { limit: 1e12, suffix: "T" },
    { limit: 1e9, suffix: "B" },
    { limit: 1e6, suffix: "M" },
    { limit: 1e3, suffix: "K" },
  ];

  for (const { limit, suffix } of units) {
    if (value >= limit) {
      const scaled = value / limit;
      return `${Number(scaled.toFixed(scaled >= 10 ? 1 : 2))}${suffix}`;
    }
  }

  return `${Math.round(value)}`;
}

export function formatFullNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return "0m";
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }

  return `${Number((seconds / 3600).toFixed(1))}h`;
}

export function formatDayLabel(date: string): string {
  return new Date(parseIsoDate(date)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Fills the gaps between the first and last entry so charts never interpolate over missing days. */
export function fillDailyGaps(series: DailyTokens[]): DailyTokens[] {
  if (series.length === 0) {
    return [];
  }

  const byDate = new Map(series.map((entry) => [entry.date, entry.tokens]));
  const filled: DailyTokens[] = [];
  const last = series[series.length - 1].date;

  for (let date = series[0].date; ; date = shiftDays(date, 1)) {
    filled.push({ date, tokens: byDate.get(date) ?? 0 });
    if (date === last) {
      break;
    }
  }

  return filled;
}

export type StreakStatus = {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  /** The current run has matched or beaten the all-time best. */
  isRecord: boolean;
  /** Active yesterday but not yet today — the run is still alive but unextended. */
  atRisk: boolean;
  /** The run already ended before yesterday. */
  isBroken: boolean;
  daysSinceActive: number | null;
};

export function deriveStreak(
  activity: ProfileActivity,
  today: string,
): StreakStatus {
  const lastActiveDate = activity.activeDates.at(-1) ?? null;
  const daysSinceActive = lastActiveDate
    ? daysBetween(lastActiveDate, today)
    : null;
  const current = activity.currentStreak;

  return {
    current,
    longest: Math.max(activity.longestStreak, current),
    lastActiveDate,
    isRecord: current > 1 && current >= activity.longestStreak,
    atRisk: current > 0 && daysSinceActive === 1,
    isBroken: current > 0 && daysSinceActive !== null && daysSinceActive > 1,
    daysSinceActive,
  };
}

export type CalendarCell = {
  date: string;
  tokens: number;
  /** 0 for no activity, 1-4 for log-scaled activity bands. */
  level: 0 | 1 | 2 | 3 | 4;
  /** Days outside the tracked window are rendered as empty scaffolding. */
  inRange: boolean;
};

export type CalendarMonthLabel = {
  label: string;
  weekIndex: number;
};

export type Calendar = {
  weeks: CalendarCell[][];
  months: CalendarMonthLabel[];
  maxTokens: number;
  activeDays: number;
  trackedDays: number;
  totalTokens: number;
  busiestDay: DailyTokens | null;
};

const MIN_WEEKS = 20;
const MAX_WEEKS = 53;

/**
 * Quartile banding rather than a linear or log ramp. Daily totals span four orders of
 * magnitude with a long tail, so any absolute scale pins nearly every active day into
 * the same band and the grid loses its texture.
 */
function quartileBands(values: number[]): [number, number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (quantile: number) =>
    sorted[Math.floor(quantile * (sorted.length - 1))] ?? 0;

  return [at(0.25), at(0.5), at(0.75)];
}

function bucketLevel(
  tokens: number,
  bands: [number, number, number],
): CalendarCell["level"] {
  if (tokens <= 0) {
    return 0;
  }

  if (tokens <= bands[0]) {
    return 1;
  }

  if (tokens <= bands[1]) {
    return 2;
  }

  return tokens <= bands[2] ? 3 : 4;
}

export function buildCalendar(
  activity: ProfileActivity,
  today: string,
): Calendar {
  const counts = activity.activityCounts;
  const byDate = new Map(counts.map((entry) => [entry.date, entry.tokens]));
  const nonZero = counts.filter((entry) => entry.tokens > 0);

  const maxTokens = nonZero.reduce((max, entry) => Math.max(max, entry.tokens), 0);
  const bands = quartileBands(nonZero.map((entry) => entry.tokens));

  const firstTracked = counts[0]?.date ?? today;
  const spanWeeks = Math.ceil((daysBetween(firstTracked, today) + 1) / 7);
  const weekCount = Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, spanWeeks));

  // Anchor the grid so the final column is the week containing today.
  const endOfWeek = shiftDays(today, 6 - new Date(parseIsoDate(today)).getUTCDay());
  const start = shiftDays(endOfWeek, -(weekCount * 7 - 1));

  const weeks: CalendarCell[][] = [];
  const months: CalendarMonthLabel[] = [];
  let seenMonth = "";

  for (let week = 0; week < weekCount; week += 1) {
    const cells: CalendarCell[] = [];

    for (let day = 0; day < 7; day += 1) {
      const date = shiftDays(start, week * 7 + day);
      const tokens = byDate.get(date) ?? 0;
      const inRange = date >= firstTracked && date <= today;

      cells.push({
        date,
        tokens,
        level: inRange ? bucketLevel(tokens, bands) : 0,
        inRange,
      });
    }

    const month = new Date(parseIsoDate(cells[0].date)).toLocaleDateString(
      "en-US",
      { month: "short", timeZone: "UTC" },
    );

    if (month !== seenMonth) {
      months.push({ label: month, weekIndex: week });
      seenMonth = month;
    }

    weeks.push(cells);
  }

  const busiestDay = nonZero.reduce<DailyTokens | null>(
    (best, entry) => (!best || entry.tokens > best.tokens ? entry : best),
    null,
  );

  return {
    weeks,
    months,
    maxTokens,
    activeDays: nonZero.length,
    trackedDays: counts.length > 0 ? daysBetween(firstTracked, today) + 1 : 0,
    totalTokens: counts.reduce((sum, entry) => sum + entry.tokens, 0),
    busiestDay,
  };
}

export type Milestone = {
  id: string;
  title: string;
  detail: string;
  kind: "record" | "threshold" | "highlight";
  earned: boolean;
  /** Present on the next unearned target so the card can show how far away it is. */
  progress?: { current: number; target: number; unit: string };
};

function nextThreshold(value: number, thresholds: number[]): number | null {
  return thresholds.find((threshold) => value < threshold) ?? null;
}

function highestThreshold(value: number, thresholds: number[]): number | null {
  return [...thresholds].reverse().find((threshold) => value >= threshold) ?? null;
}

const TOKEN_THRESHOLDS = [1e8, 2e8, 5e8, 1e9, 2e9, 5e9, 1e10, 2e10, 5e10];
const AGENT_THRESHOLDS = [10, 25, 50, 100, 250, 500];
const STREAK_THRESHOLDS = [7, 14, 30, 60, 100, 365];

/** Walks the cumulative total to find when a tier was actually reached, so recency can be judged. */
function thresholdCrossedOn(
  counts: DailyTokens[],
  threshold: number,
): string | null {
  let cumulative = 0;

  for (const entry of counts) {
    const previous = cumulative;
    cumulative += entry.tokens;

    if (previous < threshold && cumulative >= threshold) {
      return entry.date;
    }
  }

  return null;
}

export function deriveMilestones(
  activity: ProfileActivity,
  calendar: Calendar,
  streak: StreakStatus,
): Milestone[] {
  const milestones: Milestone[] = [];
  const agents = activity.agentsLocal + activity.agentsCloud;

  if (streak.isRecord) {
    milestones.push({
      id: "streak-record",
      title: "Personal record",
      detail: `${streak.current}-day streak — your longest run yet`,
      kind: "record",
      earned: true,
    });
  } else if (streak.longest > 1) {
    milestones.push({
      id: "streak-best",
      title: `${streak.longest}-day streak`,
      detail: "Longest run on record",
      kind: "record",
      earned: true,
    });
  }

  const tokenTier = highestThreshold(calendar.totalTokens, TOKEN_THRESHOLDS);
  if (tokenTier) {
    milestones.push({
      id: "tokens-tier",
      title: `${formatCompactNumber(tokenTier)} tokens`,
      detail: `${formatCompactNumber(calendar.totalTokens)} across tracked history`,
      kind: "threshold",
      earned: true,
    });
  }

  if (calendar.busiestDay) {
    milestones.push({
      id: "best-day",
      title: `${formatCompactNumber(calendar.busiestDay.tokens)} in a day`,
      detail: `Peak output on ${formatDayLabel(calendar.busiestDay.date)}`,
      kind: "highlight",
      earned: true,
    });
  }

  const agentTier = highestThreshold(agents, AGENT_THRESHOLDS);
  if (agentTier) {
    milestones.push({
      id: "agents-tier",
      title: `${agentTier}+ agents`,
      detail: `${activity.agentsLocal} local and ${activity.agentsCloud} cloud runs`,
      kind: "threshold",
      earned: true,
    });
  }

  if (activity.longestAgentSeconds >= 3600) {
    milestones.push({
      id: "marathon-agent",
      title: `${formatDuration(activity.longestAgentSeconds)} agent run`,
      detail: "Longest single agent session",
      kind: "highlight",
      earned: true,
    });
  }

  if (activity.mostActiveMonth) {
    milestones.push({
      id: "peak-month",
      title: activity.mostActiveMonth,
      detail: "Most active month so far",
      kind: "highlight",
      earned: true,
    });
  }

  const nextStreak = nextThreshold(streak.longest, STREAK_THRESHOLDS);
  if (nextStreak) {
    milestones.push({
      id: "next-streak",
      title: `${nextStreak}-day streak`,
      detail:
        streak.current > 0
          ? `${nextStreak - streak.current} more days from your current run`
          : "Start a run to chase this one",
      kind: "threshold",
      earned: false,
      progress: { current: streak.current, target: nextStreak, unit: "days" },
    });
  }

  const nextAgents = nextThreshold(agents, AGENT_THRESHOLDS);
  if (nextAgents) {
    milestones.push({
      id: "next-agents",
      title: `${nextAgents} agents`,
      detail: `${nextAgents - agents} more runs to go`,
      kind: "threshold",
      earned: false,
      progress: { current: agents, target: nextAgents, unit: "agents" },
    });
  }

  return milestones;
}

export type Celebration = {
  headline: string;
  detail: string;
};

const CELEBRATION_WINDOW_DAYS = 7;

/**
 * The one deliberate peak moment — only fires when something was genuinely earned,
 * never as ambient decoration.
 */
export function deriveCelebration(
  activity: ProfileActivity,
  calendar: Calendar,
  streak: StreakStatus,
  today: string,
): Celebration | null {
  if (streak.isRecord && !streak.isBroken) {
    return {
      headline: `${streak.current}-day record`,
      detail: "Your longest streak ever is happening right now.",
    };
  }

  if (calendar.busiestDay && daysBetween(calendar.busiestDay.date, today) <= 2) {
    return {
      headline: "Personal best",
      detail: `${formatCompactNumber(calendar.busiestDay.tokens)} tokens in a single day.`,
    };
  }

  const tokenTier = highestThreshold(calendar.totalTokens, TOKEN_THRESHOLDS);
  const crossedOn = tokenTier
    ? thresholdCrossedOn(activity.activityCounts, tokenTier)
    : null;

  if (tokenTier && crossedOn && daysBetween(crossedOn, today) <= CELEBRATION_WINDOW_DAYS) {
    return {
      headline: `${formatCompactNumber(tokenTier)} tokens`,
      detail: `You crossed ${formatCompactNumber(tokenTier)} tokens on ${formatDayLabel(crossedOn)}.`,
    };
  }

  return null;
}

export type AgentTotals = {
  local: number;
  cloud: number;
  total: number;
  localShare: number;
  cloudShare: number;
  series: DailyAgents[];
  windowTotal: number;
};

export function deriveAgentTotals(activity: ProfileActivity): AgentTotals {
  const local = activity.agentsLocal;
  const cloud = activity.agentsCloud;
  const total = local + cloud;

  return {
    local,
    cloud,
    total,
    localShare: total > 0 ? local / total : 0,
    cloudShare: total > 0 ? cloud / total : 0,
    series: activity.agentsOverTime,
    windowTotal: activity.agentsOverTime.reduce(
      (sum, entry) => sum + entry.local + entry.cloud,
      0,
    ),
  };
}

export type ProfileStory = {
  today: string;
  calendar: Calendar;
  streak: StreakStatus;
  milestones: Milestone[];
  celebration: Celebration | null;
  agents: AgentTotals;
  tokenWindow: DailyTokens[];
  tokenWindowTotal: number;
  joinedDaysAgo: number | null;
  hasActivity: boolean;
};

export function buildStory(
  activity: ProfileActivity,
  createdAt: string | null,
): ProfileStory {
  const today = resolveToday(activity);
  const calendar = buildCalendar(activity, today);
  const streak = deriveStreak(activity, today);
  const tokenWindow = fillDailyGaps(activity.tokensOverTime);

  const joinedDaysAgo = createdAt
    ? daysBetween(createdAt.slice(0, 10), today)
    : null;

  return {
    today,
    calendar,
    streak,
    milestones: deriveMilestones(activity, calendar, streak),
    celebration: deriveCelebration(activity, calendar, streak, today),
    agents: deriveAgentTotals(activity),
    tokenWindow,
    tokenWindowTotal: tokenWindow.reduce((sum, entry) => sum + entry.tokens, 0),
    joinedDaysAgo:
      joinedDaysAgo !== null && Number.isFinite(joinedDaysAgo)
        ? joinedDaysAgo
        : null,
    hasActivity: calendar.activeDays > 0,
  };
}
