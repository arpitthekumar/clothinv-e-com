import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../../_lib/session";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const { id } = await context.params;
  const body = await request.json();
  const status = body.status;
  if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 });

  // Only store staff (admin/employee) and super_admin can update order status
  if (!["admin", "employee", "super_admin"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const order = await storage.getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // If admin or employee, ensure they belong to the same store
    if (auth.user.role === "admin" || auth.user.role === "employee") {
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
