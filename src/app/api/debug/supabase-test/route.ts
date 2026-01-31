import { NextResponse } from "next/server";
import { ensureServiceRole, isUsingServiceRole } from "@server/storage/supabase.client";
import { getSupabaseServer } from "@server/storage/supabase.client";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Confirm service role presence
  const diagnostics: any = {
    usingServiceRole: isUsingServiceRole(),
    hasServiceRoleEnv: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  try {
    ensureServiceRole();
  } catch (err: any) {
    diagnostics.ensureServiceRoleError = err.message;
    return NextResponse.json({ diagnostics }, { status: 400 });
  }

  const client = getSupabaseServer();
  if (!client) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const username = `debug_user_${Date.now()}`;
  try {
    const { data, error } = await client
      .from("users")
      .insert({ username, password: "x", role: "customer", full_name: "Debug User" })
      .select("*")
      .single();

    diagnostics.insertResult = { data, error };

    // Clean up if insert worked
    if (data && data.id) {
      await client.from("users").delete().eq("id", data.id);
    }

    return NextResponse.json({ diagnostics });
  } catch (err: any) {
    diagnostics.exception = {
      message: err.message,
      stack: err.stack,
      raw: err,
    };
    return NextResponse.json({ diagnostics }, { status: 500 });
  }
}
