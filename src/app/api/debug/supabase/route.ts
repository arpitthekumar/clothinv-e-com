import { NextResponse } from "next/server";
import { isUsingServiceRole } from "@server/storage/supabase.client";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    usingServiceRole: isUsingServiceRole(),
    hasServiceRoleEnv: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasUrl: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
  });
}
