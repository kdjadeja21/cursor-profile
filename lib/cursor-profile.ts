import { cacheLife } from "next/cache";

const UPSTREAM_URL =
  "https://cursor.com/api/dashboard/get-public-profile-by-handle";

export const DEFAULT_HANDLE = "kdjadeja";

export type ProfileIdentity = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  visibility: string | null;
  badges: string[];
  links: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type DailyTokens = {
  date: string;
  tokens: number;
};

export type DailyAgents = {
  date: string;
  local: number;
  cloud: number;
};

export type ProfileActivity = {
  mostActiveMonth: string | null;
  mostActiveDay: string | null;
  longestStreak: number;
  currentStreak: number;
  activeDates: string[];
  /** Daily token totals across the full tracked history (~4 months, daily granularity). */
  activityCounts: DailyTokens[];
  agentsLocal: number;
  agentsCloud: number;
  longestAgentSeconds: number;
  /** Fixed trailing 30-day window from upstream, gaps filled with zeroes. */
  tokensOverTime: DailyTokens[];
  /** Fixed trailing 30-day window from upstream, gaps filled with zeroes. */
  agentsOverTime: DailyAgents[];
};

export type CursorProfile = {
  profile: ProfileIdentity;
  activity: ProfileActivity;
};

export class ProfileNotFoundError extends Error {
  constructor(handle: string) {
    super(`No public profile for handle "${handle}".`);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfileUnavailableError extends Error {
  constructor(message = "Failed to load the profile.") {
    super(message);
    this.name = "ProfileUnavailableError";
  }
}

export function normalizeHandle(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_HANDLE;
  }

  const handle = value.trim().replace(/^@/, "");
  return handle.length > 0 ? handle : DEFAULT_HANDLE;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Upstream serializes large integers as strings, so both forms have to be accepted. */
function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

/** `links` arrives as a `{ link1: url }` map rather than an array. */
function asStringList(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value)
      : [];

  return source
    .map((item) => asTrimmedString(item))
    .filter((item): item is string => item !== null);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asRecordList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function asIsoDate(value: unknown): string | null {
  const trimmed = asTrimmedString(value);
  return trimmed && ISO_DATE.test(trimmed) ? trimmed : null;
}

function toDailyTokens(
  entries: Record<string, unknown>[],
  tokenKeys: string[],
): DailyTokens[] {
  return entries
    .map((entry) => {
      const date = asIsoDate(entry.date);
      if (!date) {
        return null;
      }

      const key = tokenKeys.find((candidate) => candidate in entry);
      return { date, tokens: key ? asNumber(entry[key]) : 0 };
    })
    .filter((entry): entry is DailyTokens => entry !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function toDailyAgents(entries: Record<string, unknown>[]): DailyAgents[] {
  return entries
    .map((entry) => {
      const date = asIsoDate(entry.date);
      if (!date) {
        return null;
      }

      return {
        date,
        local: asNumber(entry.localCount),
        cloud: asNumber(entry.cloudCount),
      };
    })
    .filter((entry): entry is DailyAgents => entry !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function toIdentity(raw: Record<string, unknown>): ProfileIdentity | null {
  const handle = asTrimmedString(raw.handle);
  const displayName = asTrimmedString(raw.displayName);

  if (!handle || !displayName) {
    return null;
  }

  return {
    handle,
    displayName,
    avatarUrl: asTrimmedString(raw.avatarUrl),
    visibility: asTrimmedString(raw.visibility),
    badges: asStringList(raw.badges),
    links: asStringList(raw.links),
    createdAt: asTrimmedString(raw.createdAt),
    updatedAt: asTrimmedString(raw.updatedAt),
  };
}

function toActivity(raw: Record<string, unknown>): ProfileActivity {
  const activityCounts = toDailyTokens(asRecordList(raw.activityCounts), [
    "count",
    "value",
  ]);

  const activeDates = Array.isArray(raw.activeDates)
    ? raw.activeDates
        .map((item) => asIsoDate(item))
        .filter((item): item is string => item !== null)
        .sort()
    : activityCounts.filter((day) => day.tokens > 0).map((day) => day.date);

  return {
    mostActiveMonth: asTrimmedString(raw.mostActiveMonth),
    mostActiveDay: asTrimmedString(raw.mostActiveDay),
    longestStreak: asNumber(raw.longestStreak),
    currentStreak: asNumber(raw.currentStreak),
    activeDates,
    activityCounts,
    agentsLocal: asNumber(raw.agentsLocal),
    agentsCloud: asNumber(raw.agentsCloud),
    longestAgentSeconds: asNumber(raw.longestAgentSeconds),
    tokensOverTime: toDailyTokens(asRecordList(raw.tokensOverTime), ["tokens"]),
    agentsOverTime: toDailyAgents(asRecordList(raw.agentsOverTime)),
  };
}

export async function getCursorProfile(
  handleInput: string,
): Promise<CursorProfile> {
  "use cache";
  cacheLife("hours");

  const handle = normalizeHandle(handleInput);

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
  } catch {
    throw new ProfileUnavailableError("Unable to reach the profile service.");
  }

  if (upstream.status === 404) {
    throw new ProfileNotFoundError(handle);
  }

  if (!upstream.ok) {
    throw new ProfileUnavailableError();
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    throw new ProfileUnavailableError();
  }

  const body = asRecord(data);
  const profile = toIdentity(asRecord(body.profile));

  if (!profile) {
    throw new ProfileNotFoundError(handle);
  }

  return { profile, activity: toActivity(asRecord(body.activitySummary)) };
}
