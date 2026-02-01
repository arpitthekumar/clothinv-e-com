import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { storage } from "@server/storage";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const secret = process.env.Key_Secret;
    if (!secret) return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });

    const generated = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      console.error("Invalid Razorpay signature", { generated, signature: razorpay_signature });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Signature valid -> record payment and update order
    const order = await storage.getOrderById(orderId as string);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const payment = await storage.createPayment({
      order_id: order.id,
      store_id: (order as any).store_id ?? (order as any).storeId ?? null,
      provider: "razorpay",
      order_provider_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      status: "captured",
      amount: parseFloat((order as any).total_amount || 0),
      method: "card",
    } as any);

    await storage.updateOrder(order.id, { payment_status: "paid", payment_provider: "razorpay" } as any);

    return NextResponse.json({ success: true, payment }, { status: 200 });
  } catch (err: any) {
    console.error("Razorpay verify error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
