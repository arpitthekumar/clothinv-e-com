import type { SupabaseServerClient } from "../supabase.client";
import type {
  Product,
  InsertProduct,
} from "@shared/schema";

export async function getProducts(
  client: SupabaseServerClient,
  includeDeleted?: boolean
): Promise<Product[]> {
  let query = client.from("products").select("*");
  if (!includeDeleted) query = query.eq("deleted", false);
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function getProductsForStore(
  client: SupabaseServerClient,
  storeId?: string
): Promise<Product[]> {
  let q = client
    .from("products")
    .select("*")
    .eq("deleted", false)
    .or("visibility.eq.online,visibility.eq.both");
  if (storeId) q = q.eq("store_id", storeId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProduct(
  client: SupabaseServerClient,
  id: string
): Promise<Product | undefined> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Product | undefined;
}

export async function getProductBySku(
  client: SupabaseServerClient,
  sku: string
): Promise<Product | undefined> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("sku", sku)
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Product | undefined;
}

export async function getProductByBarcode(
  client: SupabaseServerClient,
  barcode: string
): Promise<Product | undefined> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Product | undefined;
}

export async function createProduct(
  client: SupabaseServerClient,
  product: InsertProduct
): Promise<Product> {
  const payload = {
    ...product,
    visibility: (product as any).visibility ?? "offline",
  };
  const { data, error } = await client
    .from("products")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  client: SupabaseServerClient,
  id: string,
  product: Partial<InsertProduct>
): Promise<Product | undefined> {
  const { data, error } = await client
    .from("products")
    .update(product)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Product | undefined;
}

export async function deleteProduct(
  client: SupabaseServerClient,
  id: string
): Promise<boolean> {
  const sb = client;
  const { error: sriErr } = await sb
    .from("sales_return_items")
    .delete()
    .eq("product_id", id);
  if (sriErr) throw sriErr;
  const { error: siErr } = await sb
    .from("sale_items")
    .delete()
    .eq("product_id", id);
  if (siErr) throw siErr;
  const { error: smErr } = await sb
    .from("stock_movements")
    .delete()
    .eq("product_id", id);
  if (smErr) throw smErr;
  const { error: pchErr } = await sb
    .from("product_cost_history")
    .delete()
    .eq("product_id", id);
  if (pchErr) throw pchErr;
  const { error: pphErr } = await sb
    .from("product_price_history")
    .delete()
    .eq("product_id", id);
  if (pphErr) throw pphErr;
  const { error: promoErr } = await sb
    .from("promotion_targets")
    .delete()
    .eq("target_type", "product")
    .eq("target_id", id);
  if (promoErr) throw promoErr;
  const { error: prodErr } = await sb.from("products").delete().eq("id", id);
  if (prodErr) throw prodErr;
  return true;
}

export async function softDeleteProduct(
  client: SupabaseServerClient,
  id: string
): Promise<boolean> {
  const { error } = await client
    .from("products")
    .update({ deleted: true, deleted_at: new Date().toISOString() as any })
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function restoreProduct(
  client: SupabaseServerClient,
  id: string
): Promise<boolean> {
  const { error } = await client
    .from("products")
    .update({ deleted: false, deleted_at: null as any })
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function updateStock(
  client: SupabaseServerClient,
  id: string,
  quantity: number
): Promise<Product | undefined> {
  const { data, error } = await client
    .from("products")
    .update({ stock: quantity })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Product | undefined;
}
