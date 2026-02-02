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

    // Try to resolve our local order id from the webhook payload.
    // Prioritize notes.clothinv_order_id -> receipt -> fallback to looking up payments with this order_provider_id
    const receipt = payment?.entity?.notes?.clothinv_order_id || payment?.entity?.receipt || null;
    let orderId = receipt;

    if (!orderId && order_provider_id) {
      // Maybe there's already a payment record referencing the razorpay order id; use it to find our order
      try {
        const { data: existing } = await (storage as any).client.from("payments").select("order_id").eq("order_provider_id", order_provider_id).limit(1).maybeSingle();
        orderId = existing?.order_id ?? null;
      } catch (e) {
        // ignore and continue
      }
    }

    if (orderId) {
      let storeId = null;
      try {
        const ord = await storage.getOrderById(orderId);
        storeId = (ord as any)?.store_id ?? (ord as any)?.storeId ?? null;
      } catch (e) {
        // ignore
      }

      await storage.createPayment({
        order_id: orderId,
        store_id: storeId,
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
