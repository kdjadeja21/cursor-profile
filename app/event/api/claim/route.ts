import { claimSpotlight, type ClaimFailureReason } from "@/lib/spotlight";
import { SupabaseConfigError } from "@/lib/supabase/server";

const STATUS_BY_REASON: Record<ClaimFailureReason, number> = {
  "invalid-handle": 400,
  "not-found": 404,
  unavailable: 502,
  "no-curated-profiles": 503,
  "already-presenting": 409,
};

const MESSAGE_BY_REASON: Record<ClaimFailureReason, string> = {
  "invalid-handle":
    "Usernames can only use letters, numbers, dots, hyphens and underscores.",
  "not-found": "That profile could not be found.",
  unavailable: "Couldn't verify that profile right now. Try again in a moment.",
  "no-curated-profiles": "Surprise Me isn't available right now.",
  "already-presenting": "Someone's up right now — try again in a bit.",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const input =
    record.random === true
      ? { kind: "random" as const }
      : typeof record.username === "string"
        ? { kind: "username" as const, username: record.username }
        : null;

  if (!input) {
    return Response.json(
      { error: "Provide a username or { random: true }." },
      { status: 400 },
    );
  }

  try {
    const result = await claimSpotlight(input);

    if (!result.ok) {
      return Response.json(
        { error: MESSAGE_BY_REASON[result.reason], reason: result.reason },
        { status: STATUS_BY_REASON[result.reason] },
      );
    }

    return Response.json({
      username: result.username,
      profile: result.profile,
      isRandom: result.isRandom,
      secondsRemaining: result.secondsRemaining,
    });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(
      { error: "Failed to submit claim." },
      { status: 502 },
    );
  }
}
