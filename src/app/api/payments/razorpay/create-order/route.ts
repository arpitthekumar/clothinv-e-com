import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await req.json();
    const orderId = body?.orderId;
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const order = await storage.getOrderById(orderId as string);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Only allow the customer who created the order or admin/super to proceed
    if (auth.user.role === "customer" && (order as any).customer_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const amount = Math.round(parseFloat((order as any).total_amount || "0") * 100); // paise

    const keyId = process.env.Key_Id;
    const keySecret = process.env.Key_Secret;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    // Create Razorpay order
    const payload = { amount, currency: "INR", receipt: order.id, payment_capture: 1 } as any;

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Razorpay create order failed:", txt);
      return NextResponse.json({ error: "Failed to create Razorpay order", details: txt }, { status: 500 });
    }

    const data = await resp.json();

    return NextResponse.json({ razorpayOrder: data, keyId }, { status: 200 });
  } catch (err: any) {
    console.error("Razorpay create-order error:", err);
    return NextResponse.json({ error: err.message || "Razorpay create order failed" }, { status: 500 });
  }
}
