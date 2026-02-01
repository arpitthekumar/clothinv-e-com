import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertSaleSchema } from "@shared/schema";
import { calculateSaleTotals } from "@/lib/sales";

/**
 * GET: Order history.
 * - customer: sales where customer_id = user.id (online orders).
 * - admin/super_admin: all sales (optionally filter by order_source=online).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const url = new URL(request.url);
  const source = url.searchParams.get("source"); // 'online' | 'pos' | omit = all

  if (auth.user.role === "customer") {
    const orders = await storage.getOrdersByCustomer(auth.user.id);
    return NextResponse.json(orders);
  }

  // Admins: show orders for their store; Super Admin: show all orders (optionally include processed)
  const includeProcessed = url.searchParams.get("includeProcessed") === "true";
  if (auth.user.role === "admin") {
    const storeId = auth.user.storeId ?? undefined;
    if (!storeId) return NextResponse.json({ error: "Admin has no store assigned" }, { status: 400 });
    const orders = await storage.getOrdersByStore(storeId);
    return NextResponse.json(orders);
  }

  // super_admin
  const orders = await storage.getOrders(includeProcessed);
  return NextResponse.json(orders);
}

/**
 * POST: Create online order (e-commerce checkout).
 * Uses same inventory logic as POS: createSale, createSaleItems, updateStock, createStockMovement.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  // Only customer, admin, or super_admin can place online orders
  const allowed = ["customer", "admin", "super_admin"];
  if (!allowed.includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const orderItems = Array.isArray(body.items)
      ? body.items
      : JSON.parse(body.items ?? "[]");

    // Ensure items belong to the same store and derive storeId
    let storeId: string | null = null;
    for (const it of orderItems) {
      const product = await storage.getProduct(it.productId);
      if (!product) throw new Error(`Product ${it.productId} not found`);
      const pidStore = (product as any).store_id || (product as any).storeId || null;
      if (!storeId) storeId = pidStore;
      if (storeId !== pidStore) throw new Error("All items must belong to the same store");
    }
    if (!storeId) throw new Error("Failed to determine store for order items");

    const totals = calculateSaleTotals(
      orderItems,
      body.discount_type || null,
      parseFloat(body.discount_value || "0")
    );

    const orderData = {
      store_id: storeId,
      customer_id: auth.user.id,
      customer_name: body.customer_name || auth.user.fullName || "Customer",
      customer_phone: body.customer_phone || "N/A",
      items: orderItems,
      subtotal: totals.subtotal.toFixed(2),
      tax_percent: totals.taxPercent.toFixed(2),
      tax_amount: totals.taxAmount.toFixed(2),
      discount_type: totals.discountType,
      discount_value: totals.discountValue.toFixed(2),
      discount_amount: totals.discountAmount.toFixed(2),
      total_amount: totals.total.toFixed(2),
      payment_method: body.payment_method || "online",
      payment_provider: body.payment_provider || null,
      payment_status: body.payment_status || "pending",
      status: "created",
    };

    const invoiceNumber = (body?.invoice_number as string) || `ORD-${Date.now()}`;
    const data = insertSaleSchema.parse({
      // for validation we re-use insertSaleSchema shape for numeric fields but will call createOrder
      user_id: auth.user.id,
      customer_id: auth.user.id,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      items: orderData.items,
      invoice_number: invoiceNumber,
      subtotal: orderData.subtotal,
      tax_percent: orderData.tax_percent,
      tax_amount: orderData.tax_amount,
      discount_type: orderData.discount_type,
      discount_value: orderData.discount_value,
      discount_amount: orderData.discount_amount,
      total_amount: orderData.total_amount,
      payment_method: orderData.payment_method,
      order_source: "online",
    });

    // Create order record (not a sale yet)
    const order = await storage.createOrder(orderData as any);

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    console.error("Order creation error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
