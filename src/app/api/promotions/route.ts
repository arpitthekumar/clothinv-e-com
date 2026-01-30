import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../_lib/session";
import { storage } from "@server/storage";
import { insertPromotionSchema, insertPromotionTargetSchema } from "@shared/schema";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  // Admins should see promotions for their store; others see platform/active promos
  const storeId = auth.user.role === "admin" && auth.user.storeId ? auth.user.storeId : undefined;
  const promos = await storage.getPromotions(storeId);
  return NextResponse.json(promos);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const promo = insertPromotionSchema.parse(body);
    // If admin creating promo, scope it to their store. Super admin may leave it platform-wide.
    if (auth.user.role === "admin" && auth.user.storeId) (promo as any).storeId = auth.user.storeId;
    const created = await storage.createPromotion(promo);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid data" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const target = insertPromotionTargetSchema.parse(body);
    // Auto-assign storeId for merchant admins when not provided
    if (auth.user.role === "admin" && auth.user.storeId && (!(target as any).storeId)) (target as any).storeId = auth.user.storeId;
    const created = await storage.addPromotionTarget(target);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid data" }, { status: 400 });
  }
}


