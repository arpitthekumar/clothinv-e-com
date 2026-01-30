import type { SupabaseServerClient } from "../supabase.client";
import type { InsertOrder, Order } from "@shared/schema";
import * as salesImpl from "./sales.impl";
import * as returnsImpl from "./returns.impl";
import * as productsImpl from "./products.impl";
import * as stockImpl from "./stock.impl";

export async function getOrders(
  client: SupabaseServerClient,
  includeProcessed = false
): Promise<Order[]> {
  let q = client.from("orders").select("*");
  if (!includeProcessed) q = q.neq("status", "delivered");
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function getOrderById(
  client: SupabaseServerClient,
  id: string
): Promise<Order | undefined> {
  const { data, error } = await client.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Order | undefined;
}

export async function getOrdersByStore(
  client: SupabaseServerClient,
  storeId: string
): Promise<Order[]> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function getOrdersByCustomer(
  client: SupabaseServerClient,
  customerId: string
): Promise<Order[]> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function createOrder(
  client: SupabaseServerClient,
  order: InsertOrder
): Promise<Order> {
  const { data, error } = await client
    .from("orders")
    .insert(order as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as Order;
}

/**
 * Update order status. If new status is 'delivered', process the order into a sale
 * (create sale, sale_items, decrement stock, create stock movements). Idempotent
 * (if processed already, it will not create duplicate sale).
 */
export async function updateOrderStatus(
  client: SupabaseServerClient,
  id: string,
  status: string,
  processedBy?: string
): Promise<Order | undefined> {
  // Fetch order
  const { data: orderData, error: fetchErr } = await client
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  const order = orderData as Order | null;
  if (!order) throw new Error("Order not found");

  // If delivering and already processed (processed_at set), skip processing
  if (status === "delivered" && order.processedAt) {
    // Just update status to delivered if not already (keep processedAt value)
    const { data: upd, error: updErr } = await client
      .from("orders")
      .update({ status, updated_at: new Date().toISOString(), processed_at: order.processedAt })
      .eq("id", id)
      .select("*")
      .single();
    if (updErr) throw updErr;
    return upd as Order;
  }

  // Update status (and set processed_at when delivered)
  const updatePayload: any = { status, updated_at: new Date().toISOString() };
  if (status === "delivered") updatePayload.processed_at = new Date().toISOString();

  const { data: updatedOrder, error: updErr } = await client
    .from("orders")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();
  if (updErr) throw updErr;

  // On delivery, create final sale and adjust stock
  if (status === "delivered") {
    // Create a sale record derived from order
    const invoice = `ORD-${Date.now()}`;
    const salePayload: any = {
      store_id: order.storeId || (order as any).store_id || null,
      user_id: processedBy || null,
      customer_id: (order as any).customer_id || null,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      items: order.items,
      invoice_number: invoice,
      subtotal: (order.subtotal as any)?.toString?.() || String(order.subtotal),
      tax_percent: (order.tax_percent as any)?.toString?.() || String(order.tax_percent || "0"),
      tax_amount: (order.tax_amount as any)?.toString?.() || String(order.tax_amount || "0"),
      discount_type: (order as any).discount_type || null,
      discount_value: (order as any).discount_value?.toString?.() || String((order as any).discount_value || "0"),
      discount_amount: (order as any).discount_amount?.toString?.() || String((order as any).discount_amount || "0"),
      total_amount: (order.total_amount as any)?.toString?.() || String(order.total_amount),
      payment_method: order.payment_method || "online",
      order_source: "online",
    };

    const sale = await salesImpl.createSale(client, salePayload);

    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items as any ?? "[]");

    // Create sale items and update stock + stock movements
    await returnsImpl.createSaleItems(client, sale.id, items);
    for (const it of items) {
      const p = await productsImpl.getProduct(client, it.productId);
      if (!p) continue;
      const newStock = Number(p.stock || 0) - Number(it.quantity || 0);
      await productsImpl.updateStock(client, it.productId, newStock);
      await stockImpl.createStockMovement(client, {
        productId: it.productId,
        userId: processedBy || "system",
        type: "sale_out",
        quantity: -Number(it.quantity || 0),
        reason: `Online order ${sale.invoice_number}`,
        refTable: "sale_items",
        refId: sale.id,
      } as any);
    }
  }

  return updatedOrder as Order;
}