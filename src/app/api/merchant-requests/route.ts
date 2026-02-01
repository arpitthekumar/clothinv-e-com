import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth, requireSuperAdmin } from "../_lib/session";
import { insertMerchantRequestSchema } from "@shared/schema";

/** POST: Apply to become merchant (any logged-in user). */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await request.json();
    const data = insertMerchantRequestSchema.parse({
      ...body,
      userId: auth.user.id,
    });
    const created = await storage.createMerchantRequest(data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** GET: List merchant requests (Super Admin only). */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      {},
      { status: "forbidden" in auth && auth.forbidden ? 403 : 401 }
    );
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as "pending" | "approved" | "rejected" | null;

  const list = await storage.getMerchantRequests(status ?? undefined);
  return NextResponse.json(list);
}
