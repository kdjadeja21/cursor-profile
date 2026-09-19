import { getSpotlightStatus } from "@/lib/spotlight";
import { SupabaseConfigError } from "@/lib/supabase/server";

/**
 * Polled by the display route roughly every 2s (PRD §7). Always live —
 * `getSpotlightStatus` touches Supabase, so this route is excluded from
 * prerendering and runs fresh on every request.
 */
export async function GET() {
  try {
    const status = await getSpotlightStatus();
    return Response.json(status);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(
      { error: "Failed to load spotlight status." },
      { status: 502 },
    );
  }
}
