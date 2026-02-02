import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 20);
  const cursor = url.searchParams.get("cursor") || null;
  const status = url.searchParams.get("status") || null;
  const start = url.searchParams.get("start") || null;
  const end = url.searchParams.get("end") || null;
  const search = url.searchParams.get("search") || null;
  const searchBy = url.searchParams.get("searchBy") || null;
  const excludeDelivered = url.searchParams.get("excludeDelivered") !== "false";

  // Admins: scope to their store. Super admin can pass storeId param.
  let storeId: string | null = null;
  if (auth.user.role === "admin") {
    if (!auth.user.storeId) return NextResponse.json({ error: "Admin has no store assigned" }, { status: 400 });
    storeId = auth.user.storeId;
  } else if (auth.user.role === "super_admin") {
    storeId = url.searchParams.get("storeId") || null;
  }

  const userId = auth.user.role === "customer" ? auth.user.id : null;

  const { data, nextCursor } = await storage.getOrdersFiltered({
    storeId,
    userId,
    limit,
    cursor,
    status,
    excludeDelivered,
    start,
    end,
    search,
    searchBy,
  });

  return NextResponse.json({ data, nextCursor });
}