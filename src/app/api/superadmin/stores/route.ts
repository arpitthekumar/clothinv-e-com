import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireSuperAdmin } from "../../_lib/session";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const stores = await storage.getStores();
  return NextResponse.json(stores);
}
