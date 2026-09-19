/**
 * Pure spotlight logic with zero runtime cross-module imports, so it can run
 * directly under `node --experimental-strip-types --test` (this repo's test
 * runner doesn't resolve the `@/` alias). Everything here has no dependency on
 * Supabase, the profile API, or Next — see `lib/spotlight.ts` for the parts that do.
 *
 * The one exception is `CursorProfile` below, imported `type`-only: type-only
 * imports are erased before module resolution, so it costs nothing at runtime.
 */
import type { CursorProfile } from "@/lib/cursor-profile";

/** How long a claim stays live before the display reverts to idle. Server-computed only (FR5). */
export const EXPIRY_SECONDS = 60;

/**
 * Fixed, pre-curated pool for "Surprise Me" (FR2). Deliberately not live attendee
 * data, and kept local to this feature rather than shared with the landing page's
 * own featured-handle list, per the "put everything here" brief.
 */
export const CURATED_HANDLES: readonly string[] = [
  "eric",
  "lauren",
  "leerob",
  "emily",
  "nate",
  "erik",
];

/**
 * The full profile + activity payload is stored (not a trimmed summary) so the
 * display route can render the exact same scroll-through experience as `/@handle`
 * — same story scenes, same headline stats, same share cards — rather than a
 * cut-down highlight card.
 */
export type SpotlightProfileSnapshot = CursorProfile;

export type SpotlightStatusResponse =
  | { status: "idle" }
  | {
      status: "presenting";
      username: string;
      profile: SpotlightProfileSnapshot;
      isRandom: boolean;
      secondsRemaining: number;
    };

export type ClaimInput =
  | { kind: "username"; username: string }
  | { kind: "random" };

export type ClaimFailureReason =
  | "invalid-handle"
  | "not-found"
  | "unavailable"
  | "no-curated-profiles"
  | "already-presenting";

export type ClaimResult =
  | {
      ok: true;
      username: string;
      profile: SpotlightProfileSnapshot;
      isRandom: boolean;
      secondsRemaining: number;
    }
  | { ok: false; reason: ClaimFailureReason };

/** Seconds left on a presenting slot given when it started — never trusts a client timer. */
export function computeSecondsRemaining(
  startedAtIso: string | null,
  nowMs: number = Date.now(),
): number {
  if (!startedAtIso) {
    return 0;
  }

  const startedMs = Date.parse(startedAtIso);
  if (!Number.isFinite(startedMs)) {
    return 0;
  }

  const elapsedSeconds = (nowMs - startedMs) / 1000;
  return Math.max(0, Math.ceil(EXPIRY_SECONDS - elapsedSeconds));
}

export function isExpired(
  startedAtIso: string | null,
  nowMs: number = Date.now(),
): boolean {
  return computeSecondsRemaining(startedAtIso, nowMs) <= 0;
}

/** Hidden/disabled by callers when this returns null (empty/misconfigured list, §9). */
export function pickCuratedHandle(
  random: () => number = Math.random,
): string | null {
  if (CURATED_HANDLES.length === 0) {
    return null;
  }

  const index = Math.min(
    CURATED_HANDLES.length - 1,
    Math.floor(random() * CURATED_HANDLES.length),
  );

  return CURATED_HANDLES[index];
}
