import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return NextResponse.json({}, { status: 401 });

    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const order = await storage.getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Customers may only view their own orders
    if (auth.user.role === "customer" && order.customer_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (err: unknown) {
    console.error("Order detail API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
