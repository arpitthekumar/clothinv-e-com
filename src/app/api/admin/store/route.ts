import { NextResponse } from "next/server";
import { SupabaseStorage } from "@/server/storage/storage.service";
import { requireAdmin } from "../_lib/session";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const storage = new SupabaseStorage();
  const storeId = auth.user.storeId;
  if (!storeId) return NextResponse.json({ error: "No store assigned to user" }, { status: 400 });
  const s = await storage.getStoreById(storeId);
  if (!s) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const storage = new SupabaseStorage();
  const storeId = auth.user.role === "super_admin" && body.id ? body.id : auth.user.storeId;
  if (!storeId) return NextResponse.json({ error: "No store assigned to user" }, { status: 400 });

  const allowed = ["name", "addressLine1", "addressLine2", "city", "state", "postcode", "country", "latitude", "longitude"];
  const patch: any = {};
  for (const k of allowed) {
    if (body[k] !== undefined) patch[k] = body[k];
  }

  try {
    const updated = await storage.updateStore(storeId, patch);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("Update store failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
