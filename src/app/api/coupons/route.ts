import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../_lib/session";
import { storage } from "@server/storage";
import { insertDiscountCouponSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  // Coupons are store-scoped for merchant admins. If an admin has no store assignment,
  // that's a configuration error and should be fixed (instead of returning platform-wide data).
  if (auth.user.role === "admin" && !auth.user.storeId) {
    return NextResponse.json(
      { error: "Admin account is missing store assignment (storeId)." },
      { status: 400 }
    );
  }

  const storeId =
    auth.user.role === "admin" && auth.user.storeId ? auth.user.storeId : undefined;
  const coupons = await storage.getDiscountCoupons(storeId);
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });
  if (!auth.user.storeId) {
    return NextResponse.json(
      { error: "Admin account is missing store assignment (storeId)." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const name = (body?.name ?? "").toString().trim().toUpperCase();
    const percentageNum = parseFloat(body?.percentage);
    if (!name || isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      return NextResponse.json({ error: "Invalid name or percentage" }, { status: 400 });
    }
    const data = insertDiscountCouponSchema.parse({
      name,
      // Keep a consistent 2-decimal representation for the DB decimal column.
      percentage: percentageNum.toFixed(2),
      active: true,
      createdBy: auth.user.id,
      storeId: auth.user.storeId,
    });
    const created = await storage.createDiscountCoupon(data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid coupon data", issues: error.issues },
        { status: 400 }
      );
    }

    const msg = typeof error?.message === "string" ? error.message : "Invalid data";
    if (msg.includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "Coupon name already exists" }, { status: 400 });
    }
    // If Supabase returned a structured error, surface the most useful parts.
    const details =
      typeof error?.details === "string"
        ? error.details
        : typeof error?.hint === "string"
          ? error.hint
          : undefined;
    return NextResponse.json({ error: msg, details }, { status: 400 });
  }
}


