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
  return createClient(URL, KEY, {
    auth: { persistSession: false },
  });
}

export const hasSupabase = Boolean(URL && KEY);
