import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCursorProfile } from "@/lib/cursor-profile";
import { HANDLE_PATTERN, parseHandleInput } from "@/lib/handle";
import {
  EXPIRY_SECONDS,
  computeSecondsRemaining,
  pickCuratedHandle,
  type ClaimInput,
  type ClaimResult,
  type SpotlightProfileSnapshot,
  type SpotlightStatusResponse,
} from "@/lib/spotlight-lock";

export {
  CURATED_HANDLES,
  EXPIRY_SECONDS,
  computeSecondsRemaining,
  isExpired,
  pickCuratedHandle,
} from "@/lib/spotlight-lock";
export type {
  ClaimFailureReason,
  ClaimInput,
  ClaimResult,
  SpotlightProfileSnapshot,
  SpotlightStatusResponse,
} from "@/lib/spotlight-lock";

const SESSION_ID = 1;
const SESSION_TABLE = "spotlight_session";

type SpotlightRow = {
  id: number;
  status: "idle" | "presenting";
  profile_username: string | null;
  profile_data: SpotlightProfileSnapshot | null;
  started_at: string | null;
  is_random: boolean;
};

/**
 * Flips a stale `presenting` row back to `idle`. Safe to call from any number of
 * concurrent requests: the `WHERE status = 'presenting'` guard means only the first
 * caller's UPDATE actually matches a row — everyone else's is a no-op.
 */
async function expireIfStale(
  supabase: ReturnType<typeof getSupabaseServerClient>,
): Promise<void> {
  const cutoffIso = new Date(Date.now() - EXPIRY_SECONDS * 1000).toISOString();

  await supabase
    .from(SESSION_TABLE)
    .update({
      status: "idle",
      profile_username: null,
      profile_data: null,
      started_at: null,
      is_random: false,
    })
    .eq("id", SESSION_ID)
    .eq("status", "presenting")
    .lt("started_at", cutoffIso);
}

export async function getSpotlightStatus(): Promise<SpotlightStatusResponse> {
  const supabase = getSupabaseServerClient();
  await expireIfStale(supabase);

  const { data, error } = await supabase
    .from(SESSION_TABLE)
    .select("*")
    .eq("id", SESSION_ID)
    .maybeSingle<SpotlightRow>();

  if (error || !data || data.status !== "presenting" || !data.profile_data || !data.started_at) {
    return { status: "idle" };
  }

  const secondsRemaining = computeSecondsRemaining(data.started_at);
  if (secondsRemaining <= 0) {
    return { status: "idle" };
  }

  return {
    status: "presenting",
    username: data.profile_username ?? data.profile_data.profile.handle,
    profile: data.profile_data,
    isRandom: data.is_random,
    secondsRemaining,
  };
}

/**
 * The atomic claim (PRD Option A). `expireIfStale` and the claim UPDATE below are two
 * separate statements, but that's fine: the claim's own `WHERE status = 'idle'` guard
 * is the actual race-breaker, and it's correct on its own regardless of what ran before
 * it — only one concurrent caller's UPDATE can ever match that row.
 */
export async function claimSpotlight(input: ClaimInput): Promise<ClaimResult> {
  let handle: string;
  let isRandom = false;

  if (input.kind === "random") {
    const picked = pickCuratedHandle();
    if (!picked) {
      return { ok: false, reason: "no-curated-profiles" };
    }
    handle = picked;
    isRandom = true;
  } else {
    const parsed = parseHandleInput(input.username);
    if (!parsed || !HANDLE_PATTERN.test(parsed)) {
      return { ok: false, reason: "invalid-handle" };
    }
    handle = parsed;
  }

  const profileResult = await getCursorProfile(handle);
  if (!profileResult.ok) {
    return {
      ok: false,
      reason: profileResult.reason === "not-found" ? "not-found" : "unavailable",
    };
  }

  const snapshot: SpotlightProfileSnapshot = {
    profile: profileResult.profile,
    activity: profileResult.activity,
  };

  const supabase = getSupabaseServerClient();
  await expireIfStale(supabase);

  const startedAtIso = new Date().toISOString();
  const { data, error } = await supabase
    .from(SESSION_TABLE)
    .update({
      status: "presenting",
      profile_username: snapshot.profile.handle,
      profile_data: snapshot,
      started_at: startedAtIso,
      is_random: isRandom,
    })
    .eq("id", SESSION_ID)
    .eq("status", "idle")
    .select();

  if (error) {
    return { ok: false, reason: "unavailable" };
  }

  if (!data || data.length === 0) {
    return { ok: false, reason: "already-presenting" };
  }

  return {
    ok: true,
    username: snapshot.profile.handle,
    profile: snapshot,
    isRandom,
    secondsRemaining: EXPIRY_SECONDS,
  };
}
