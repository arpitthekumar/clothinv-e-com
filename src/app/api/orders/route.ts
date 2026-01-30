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
    const sales = await storage.getSalesByCustomer(auth.user.id);
    return NextResponse.json(source === "online" ? sales : sales);
  }

  const includeDeleted = url.searchParams.get("includeDeleted") === "true";
  const sales = await storage.getSales(includeDeleted);
  const filtered =
    source === "online"
      ? sales.filter((s: { order_source?: string }) => s.order_source === "online")
      : source === "pos"
        ? sales.filter((s: { order_source?: string }) => s.order_source === "pos")
        : sales;
  return NextResponse.json(filtered);
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
    const saleItems = Array.isArray(body.items)
      ? body.items
      : JSON.parse(body.items ?? "[]");

    const totals = calculateSaleTotals(
      saleItems,
      body.discount_type || null,
      parseFloat(body.discount_value || "0")
    );

    const saleData = {
      user_id: auth.user.id,
      customer_id: auth.user.id,
      customer_name: body.customer_name || auth.user.fullName || "Customer",
      customer_phone: body.customer_phone || "N/A",
      items: saleItems,
      invoice_number: body.invoice_number || `ORD-${Date.now()}`,
      subtotal: totals.subtotal.toFixed(2),
      tax_percent: totals.taxPercent.toFixed(2),
      tax_amount: totals.taxAmount.toFixed(2),
      discount_type: totals.discountType,
      discount_value: totals.discountValue.toFixed(2),
      discount_amount: totals.discountAmount.toFixed(2),
      total_amount: totals.total.toFixed(2),
      payment_method: body.payment_method || "online",
      order_source: "online",
    };

    const data = insertSaleSchema.parse(saleData);
    const sale = await storage.createSale(data);

    const items = Array.isArray(data.items)
      ? data.items
      : JSON.parse(data.items as string);

    await storage.createSaleItems(sale.id, items);

    for (const item of items) {
      const product = await storage.getProduct(item.productId);
      if (!product) continue;
      await storage.updateStock(item.productId, product.stock - item.quantity);
      await storage.createStockMovement({
        productId: item.productId,
        userId: auth.user.id,
        type: "sale_out",
        quantity: -item.quantity,
        reason: `Online order ${sale.invoice_number}`,
        refTable: "sale_items",
        refId: sale.id,
      } as import("@shared/schema").InsertStockMovement);
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    console.error("Order creation error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
