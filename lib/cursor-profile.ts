import { cacheLife } from "next/cache";
import { normalizeHandle } from "@/lib/handle";
import { asNumber, resolveTokens } from "@/lib/tokens";

export { DEFAULT_HANDLE, normalizeHandle, parseHandleInput } from "@/lib/handle";

const UPSTREAM_URL =
  "https://cursor.com/api/dashboard/get-public-profile-by-handle";

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

export type TopModel = {
  name: string;
  vendor: string | null;
  agentRequests: number;
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
  /** Present only when upstream reports model mix; empty when omitted. */
  topModels: TopModel[];
};

export type CursorProfile = {
  profile: ProfileIdentity;
  activity: ProfileActivity;
};

/**
 * A result rather than a thrown error on purpose. Rejections from a `use cache`
 * function are serialized across the cache boundary, so the original class is gone by
 * the time a caller tries to tell "no such profile" apart from "upstream is down" —
 * which turned every missing handle into a 500 instead of the not-found page.
 */
export type ProfileResult =
  | ({ ok: true } & CursorProfile)
  | { ok: false; reason: "not-found" | "unavailable" };

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

      const tokens = resolveTokens(entry, tokenKeys);
      if (tokens === null) {
        return null;
      }

      return { date, tokens };
    })
    .filter((entry): entry is DailyTokens => entry !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function toTopModels(value: unknown): TopModel[] {
  return asRecordList(value)
    .map((entry) => {
      const name = asTrimmedString(entry.name);
      const agentRequests = asNumber(entry.agentRequests);

      if (!name || agentRequests <= 0) {
        return null;
      }

      return {
        name,
        vendor: asTrimmedString(entry.vendor),
        agentRequests,
      };
    })
    .filter((entry): entry is TopModel => entry !== null)
    .sort((a, b) => b.agentRequests - a.agentRequests);
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
    "value",
    "count",
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
    topModels: toTopModels(raw.topModels),
  };
}

const UPSTREAM_TIMEOUT_MS = 8_000;

async function fetchCursorProfile(handle: string): Promise<ProfileResult> {
  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (upstream.status === 404) {
    return { ok: false, reason: "not-found" };
  }

  if (!upstream.ok) {
    return { ok: false, reason: "unavailable" };
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const body = asRecord(data);
  const profile = toIdentity(asRecord(body.profile));

  if (!profile) {
    return { ok: false, reason: "not-found" };
  }

  return {
    ok: true,
    profile,
    activity: toActivity(asRecord(body.activitySummary)),
  };
}

export async function getCursorProfile(
  handleInput: string,
): Promise<ProfileResult> {
  "use cache";

  const handle = normalizeHandle(handleInput);
  const result = await fetchCursorProfile(handle);

  if (result.ok) {
    cacheLife("hours");
    return result;
  }

  switch (result.reason) {
    case "unavailable":
      // A live-event hiccup must not 502 this handle for the rest of the night.
      cacheLife({ stale: 0, revalidate: 5, expire: 10 });
      return result;
    case "not-found":
      cacheLife({ stale: 60, revalidate: 120, expire: 300 });
      return result;
    default: {
      const exhaustive: never = result.reason;
      return exhaustive;
    }
  }
}
