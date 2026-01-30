import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const id = params.id;
  const body = await request.json();
  const status = body.status;
  if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 });

  // Only admins (store admins) and super_admin can update order status
  if (!["admin", "super_admin"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const order = await storage.getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // If admin, ensure they belong to the same store
    if (auth.user.role === "admin") {
      if (auth.user.storeId !== (order as any).store_id && auth.user.storeId !== (order as any).storeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await storage.updateOrderStatus(id, status, auth.user.id);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    console.error("Order status update error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
