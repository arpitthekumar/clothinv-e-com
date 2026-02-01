import type { SupabaseServerClient } from "../supabase.client";
import type { InsertOrder, Order } from "@shared/schema";
import * as salesImpl from "./sales.impl";
import * as returnsImpl from "./returns.impl";
import * as productsImpl from "./products.impl";
import * as stockImpl from "./stock.impl";
import { ORDER_STATUS } from "@shared/schema";

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

export async function getOrdersFiltered(
  client: SupabaseServerClient,
  params: {
    storeId?: string | null;
    userId?: string | null;
    limit: number;
    cursor?: string | null;
    status?: string | null;
    excludeDelivered?: boolean;
    start?: string | null;
    end?: string | null;
    search?: string | null;
    searchBy?: string | null;
  }
) {
  const { storeId, userId, limit, cursor, status, excludeDelivered = true, start, end, search, searchBy } = params;
  let query = client.from("orders").select("*");
  if (storeId) query = query.eq("store_id", storeId);
  if (userId) query = query.eq("customer_id", userId);
  if (status) query = query.eq("status", status);
  else if (excludeDelivered) query = query.neq("status", "delivered");
  if (start) query = query.gte("created_at", start);
  if (end) query = query.lte("created_at", end);
  if (search && searchBy) {
    const isNumeric = !isNaN(Number(search));
    let orParts: string[] = [];
    switch (searchBy) {
      case "invoice":
        orParts.push(`invoice_number.ilike.%${search}%`);
        break;
      case "name":
        orParts.push(`customer_name.ilike.%${search}%`);
        break;
      case "phone":
        orParts.push(`customer_phone.ilike.%${search}%`);
        break;
      case "id":
        orParts.push(`id.eq.${search}`);
        break;
      case "all":
      default:
        orParts = [
          `invoice_number.ilike.%${search}%`,
          `customer_name.ilike.%${search}%`,
          `customer_phone.ilike.%${search}%`,
        ];
        if (isNumeric) orParts.push(`total_amount.eq.${Number(search)}`);
        break;
    }
    if (orParts.length > 0) query = query.or(orParts.join(","));
  }
  if (cursor) query = query.lt("created_at", cursor);
  query = query.order("created_at", { ascending: false }).limit(limit + 1);
  const { data, error } = await query;
  if (error) throw error;
  const hasMore = data.length > limit;
  const result = hasMore ? data.slice(0, limit) : data;
  return {
    data: result,
    nextCursor: hasMore ? result[result.length - 1].created_at : null,
  };
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

export async function updateOrder(
  client: SupabaseServerClient,
  id: string,
  patch: Partial<InsertOrder>
): Promise<Order | undefined> {
  const { data, error } = await client
    .from("orders")
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Order | undefined;
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
  // Validate status value
  if (!ORDER_STATUS.includes(status as any)) throw new Error("Invalid status");
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
      storeId: order.storeId || (order as any).store_id || null,
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

    // Keep the order record (do not delete). It remains for payments and auditing. Delivered orders will be hidden by default
    // Return an object indicating moved-to-sale so callers can react accordingly
    return { ...(updatedOrder as any), movedToSaleId: sale.id } as any;
  }

  return updatedOrder as Order;
}