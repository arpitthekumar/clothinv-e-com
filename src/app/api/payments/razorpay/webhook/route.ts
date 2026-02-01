import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  const secret = process.env.Key_Secret;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || req.headers.get("x-razorpay-signature".toLowerCase());
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const generated = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (generated !== signature) {
    console.error("Razorpay webhook signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);

  // Basic handling for payment.captured event
  if (payload?.event === "payment.captured") {
    const { payment } = payload?.payload || {};
    const pid = payment?.entity?.id;
    const order_provider_id = payment?.entity?.order_id;
    const amount = payment?.entity?.amount || 0;

    // Try to find payment by order_provider_id -> or use order's receipt
    // For simplicity: find order by receipt == order id
    const receipt = payment?.entity?.notes?.receipt || null;
    let orderId = receipt;

    if (!orderId && order_provider_id) {
      // Try to find orders with this provider id
      const orders = await storage.getOrders(true);
      const match = (orders || []).find((o: any) => o.payment_provider === "razorpay" && o.payment_status !== "paid" && o.id === (payment?.entity?.notes?.receipt || ""));
      orderId = match?.id ?? null;
    }

    if (orderId) {
      await storage.createPayment({
        order_id: orderId,
        store_id: null,
        provider: "razorpay",
        order_provider_id,
        payment_id: pid,
        status: "captured",
        amount: parseFloat((amount / 100).toFixed(2)),
        method: payment?.entity?.method || null,
      } as any);

      await storage.updateOrder(orderId, { payment_status: "paid", payment_provider: "razorpay" } as any);
    }
  }

  return NextResponse.json({ received: true });
}
