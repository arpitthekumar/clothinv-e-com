import type { SupabaseServerClient } from "../supabase.client";
import type { Sale, InsertSale } from "@shared/schema";

export async function getSales(
  client: SupabaseServerClient,
  includeDeleted: boolean = false
): Promise<Sale[]> {
  let query = client.from("sales").select("*");
  if (!includeDeleted) query = query.eq("deleted", false);
  const { data, error } = await query.order("created_at", {
    ascending: false,
  });
  if (error) throw error;
  return data as Sale[];
}

export async function getSalesFiltered(
  client: SupabaseServerClient,
  params: {
    userId?: string | null;
    limit: number;
    cursor?: string | null;
    deleted?: boolean;
    payment?: string | null;
    category?: string | null;
    product?: string | null;
    start?: string | null;
    end?: string | null;
    search?: string | null;
    searchBy?: string;
  }
) {
  const {
    userId,
    limit,
    cursor,
    deleted,
    payment,
    category,
    product,
    start,
    end,
    search,
    searchBy,
  } = params;
  let query = client.from("sales").select("*");
  if (userId) query = query.eq("user_id", userId);
  if (deleted !== undefined) query = query.eq("deleted", deleted);
  if (payment) query = query.ilike("payment_method", payment);
  if (start) query = query.gte("created_at", start);
  if (end) query = query.lte("created_at", end);
  if (product) query = query.contains("items", [{ productId: product }]);
  if (category) query = query.contains("items", [{ category }]);
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
      case "payment":
        orParts.push(`payment_method.ilike.%${search}%`);
        break;
      case "amount":
        if (isNumeric) orParts.push(`total_amount.eq.${Number(search)}`);
        break;
      case "all":
      default:
        orParts = [
          `invoice_number.ilike.%${search}%`,
          `payment_method.ilike.%${search}%`,
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

export function querySalesTable(client: SupabaseServerClient) {
  return client.from("sales");
}

export async function getSalesByUser(
  client: SupabaseServerClient,
  userId: string,
  includeDeleted: boolean = false
): Promise<Sale[]> {
  let query = client
    .from("sales")
    .select("*")
    .eq("user_id", userId);
  if (!includeDeleted) query = query.eq("deleted", false);
  const { data, error } = await query.order("created_at", {
    ascending: false,
  });
  if (error) throw error;
  return data as Sale[];
}

export async function getSalesByCustomer(
  client: SupabaseServerClient,
  customerId: string
): Promise<Sale[]> {
  const { data, error } = await client
    .from("sales")
    .select("*")
    .eq("customer_id", customerId)
    .eq("deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Sale[];
}

export async function getSalesToday(
  client: SupabaseServerClient
): Promise<Sale[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await client
    .from("sales")
    .select("*")
    .gte("created_at", today.toISOString())
    .eq("deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Sale[];
}

export async function createSale(
  client: SupabaseServerClient,
  sale: InsertSale
): Promise<Sale> {
  const payload: any = {
    user_id: sale.user_id,
    customer_id: (sale as any).customer_id ?? null,
    customer_name: sale.customer_name?.trim() || "Walk-in Customer",
    customer_phone: sale.customer_phone?.trim() || "N/A",
    items: sale.items,
    invoice_number: sale.invoice_number,
    subtotal: parseFloat(sale.subtotal || "0").toFixed(2),
    tax_percent: parseFloat(sale.tax_percent || "0").toFixed(2),
    tax_amount: parseFloat(sale.tax_amount || "0").toFixed(2),
    discount_type: sale.discount_type || null,
    discount_value: parseFloat(sale.discount_value || "0").toFixed(2),
    discount_amount: parseFloat(sale.discount_amount || "0").toFixed(2),
    total_amount: parseFloat(sale.total_amount || "0").toFixed(2),
    payment_method: sale.payment_method || "cash",
    order_source: (sale as any).order_source || "pos",
  };

  if ((sale as any).storeId) {
    payload.store_id = (sale as any).storeId;
  }
  const { data, error } = await client
    .from("sales")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as Sale;
}

export async function softDeleteSale(
  client: SupabaseServerClient,
  saleId: string
): Promise<boolean> {
  const { error } = await client
    .from("sales")
    .update({ deleted: true, deleted_at: new Date().toISOString() as any })
    .eq("id", saleId);
  if (error) throw error;
  return true;
}

export async function restoreSale(
  client: SupabaseServerClient,
  saleId: string
): Promise<boolean> {
  const { error } = await client
    .from("sales")
    .update({ deleted: false, deleted_at: null as any })
    .eq("id", saleId);
  if (error) throw error;
  return true;
}

export async function deleteSale(
  client: SupabaseServerClient,
  saleId: string
): Promise<boolean> {
  const sb = client;
  const { data: salesReturns, error: salesReturnFetchError } = await sb
    .from("sales_returns")
    .select("id")
    .eq("sale_id", saleId);
  if (salesReturnFetchError) throw salesReturnFetchError;
  const salesReturnIds = (salesReturns || []).map((sr: any) => sr.id);
  if (salesReturnIds.length > 0) {
    const { error: stockFromReturnsError } = await sb
      .from("stock_movements")
      .delete()
      .eq("ref_table", "sales_return_items")
      .in("ref_id", salesReturnIds as any);
    if (stockFromReturnsError) throw stockFromReturnsError;
    const { error: salesReturnItemsDeleteError } = await sb
      .from("sales_return_items")
      .delete()
      .in("sales_return_id", salesReturnIds as any);
    if (salesReturnItemsDeleteError) throw salesReturnItemsDeleteError;
    const { error: salesReturnsDeleteError } = await sb
      .from("sales_returns")
      .delete()
      .in("id", salesReturnIds as any);
    if (salesReturnsDeleteError) throw salesReturnsDeleteError;
  }
  const { error: stockMovementsError } = await sb
    .from("stock_movements")
    .delete()
    .eq("ref_table", "sale_items")
    .eq("ref_id", saleId);
  if (stockMovementsError) throw stockMovementsError;
  const { error: saleItemsError } = await sb
    .from("sale_items")
    .delete()
    .eq("sale_id", saleId);
  if (saleItemsError) throw saleItemsError;
  const { error: paymentsError } = await sb
    .from("payments")
    .delete()
    .eq("sale_id", saleId);
  if (paymentsError) throw paymentsError;
  const { error: saleDeleteError } = await sb
    .from("sales")
    .delete()
    .eq("id", saleId);
  if (saleDeleteError) throw saleDeleteError;
  return true;
}
