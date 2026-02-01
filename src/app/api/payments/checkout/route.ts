import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await request.json();
    const { orderId, provider = "razorpay", method = "card" } = body;
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const order = await storage.getOrderById(orderId as string);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Ensure the user is allowed to pay for this order
    if (auth.user.role === "customer" && (order as any).customer_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Simulate payment capture (or integrate Razorpay here when keys present)
    const amount = parseFloat((order.total_amount as any) || "0");

    // Create payment record
    const payment = await storage.createPayment({
      orderId: order.id,
      storeId: (order as any).store_id ?? (order as any).storeId ?? null,
      provider,
      order_provider_id: null,
      payment_id: `simulated-${Date.now()}`,
      status: "captured",
      amount,
      method,
    } as any);

    // Update order payment_status to 'paid'
    await storage.updateOrder(order.id, { payment_status: "paid", payment_provider: provider });

    return NextResponse.json({ success: true, payment }, { status: 200 });
  } catch (err: any) {
    console.error("Payment error:", err);
    return NextResponse.json({ error: err.message || "Payment failed" }, { status: 400 });
  }
}
