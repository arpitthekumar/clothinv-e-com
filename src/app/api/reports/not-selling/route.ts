import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role === "employee") return NextResponse.json({}, { status: 403 });

  const url = new URL(request.url);
  const sinceDays = parseInt(url.searchParams.get("sinceDays") || "30", 10);

  // Directly return filtered data from storage
  const data = await storage.getNotSellingProducts({ sinceDays });

  return NextResponse.json(data);
}
