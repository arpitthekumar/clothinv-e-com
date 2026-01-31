/**
 * Supabase client for server-side use only.
 * Auth/session logic lives in app/api/_lib/session.ts — not here.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseServerClient = SupabaseClient;

const URL = (process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined;

/** Returns true when the SUPABASE_SERVICE_ROLE_KEY is actually being used. */
export function isUsingServiceRole(): boolean {
  return Boolean(KEY && process.env.SUPABASE_SERVICE_ROLE_KEY && KEY === process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Throw helpful error if service role key is required but not available. */
export function ensureServiceRole(): void {
  if (!isUsingServiceRole()) {
    throw new Error(
      "Supabase service role key is not in use. Set SUPABASE_SERVICE_ROLE_KEY in your server env and restart the dev server."
    );
  }
}

export function getSupabaseServer() {
  if (!URL || !KEY) {
    console.error("❌ Supabase configuration missing");
    return null;
  }
  try {
    new globalThis.URL(URL);
  } catch {
    console.error("❌ Invalid Supabase URL format:", URL);
    return null;
  }

  if (isUsingServiceRole()) {
    // Informational only — do not print keys
    console.info("Supabase server client: using SUPABASE_SERVICE_ROLE_KEY (service role) — privileged operations allowed.");
  } else {
    console.info("Supabase server client: using anon key — Row Level Security (RLS) will apply. To perform privileged server operations set SUPABASE_SERVICE_ROLE_KEY in env.");
  }

  return createClient(URL, KEY, {
    auth: { persistSession: false },
  });
}

export const hasSupabase = Boolean(URL && KEY);
