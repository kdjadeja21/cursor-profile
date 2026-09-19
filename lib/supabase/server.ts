import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client, built with the service-role key so the singleton
 * `spotlight_session` row can be read/written without RLS policies. Never
 * import this from a "use client" module — the key must not reach the browser.
 */
let cached: SupabaseClient | null = null;

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
    this.name = "SupabaseConfigError";
  }
}

export function getSupabaseServerClient(): SupabaseClient {
  if (cached) {
    return cached;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new SupabaseConfigError();
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cached;
}
