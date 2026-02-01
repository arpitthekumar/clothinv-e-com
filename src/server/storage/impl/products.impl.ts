import type { SupabaseServerClient } from "../supabase.client";
import type {
  Product,
  InsertProduct,
} from "@shared/schema";
import crypto from "crypto";

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
  storeId?: string,
  filters?: { categorySlug?: string; minPrice?: string; maxPrice?: string },
  options?: { includeDeleted?: boolean; includeOffline?: boolean }
): Promise<Product[]> {
  const includeDeleted = options?.includeDeleted ?? false;
  const includeOffline = options?.includeOffline ?? false;

  let q = client.from("products").select("*");

  if (!includeDeleted) q = q.eq("deleted", false);
  if (!includeOffline) q = q.or("visibility.eq.online,visibility.eq.both");

  if (storeId) q = q.eq("store_id", storeId);

  if (filters?.categorySlug) {
    // Resolve category slug to category id, considering store scope (storeId may be undefined for platform categories)
    const { data: cats, error: cErr } = await client
      .from("categories")
      .select("*")
      .eq("slug", filters.categorySlug)
      .limit(1);
    if (cErr) throw cErr;
    const cat = (cats ?? [])[0];
    if (cat) {
      q = q.eq("category_id", cat.id);
    } else {
      // no matching category -> return empty
      return [] as Product[];
    }
  }

  if (filters?.minPrice) q = q.gte("price", filters.minPrice);
  if (filters?.maxPrice) q = q.lte("price", filters.maxPrice);

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

export function slugify(input: string) {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlugForStore(client: SupabaseServerClient, base: string, storeId?: string | null) {
  let attempt = base;
  let suffix = 1;
  while (true) {
    const q = client.from("products").select("id").eq("slug", attempt);
    if (storeId) (q as any).eq("store_id", storeId);
    const { data, error } = await q.limit(1);
    if (error) throw error;
    if (!data || (data as any).length === 0) return attempt;
    attempt = `${base}-${suffix++}`;
  }
}

export async function createProduct(
  client: SupabaseServerClient,
  product: InsertProduct
): Promise<Product> {
  const payload: any = {
    ...product,
    visibility: (product as any).visibility ?? "offline",
    // Respect existing snake_case store_id if present, otherwise use camelCase storeId
    store_id: (product as any).store_id ?? (product as any).storeId ?? null,
  };

  // Ensure id exists so slug can include it (id-prefixed slug). Generate one on app side
  if (!payload.id) {
    payload.id = crypto.randomUUID();
  }

  // Ensure a slug exists and is unique per store. Use id-prefixed slug to guarantee uniqueness (id-name)
  if (!payload.slug || String(payload.slug).trim() === "") {
    const base = slugify(product.name || payload.id);
    payload.slug = `${payload.id}-${base}`;
  }

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
  const payload: any = { ...product };
  if ((product as any).storeId !== undefined) payload.store_id = (product as any).storeId;
  if ((product as any).store_id !== undefined) payload.store_id = (product as any).store_id;

  // If slug is missing or empty, try to generate one using product name and include id to avoid collisions
  if ((!payload.slug || String(payload.slug).trim() === "") && product.name) {
    const base = slugify(product.name);
    payload.slug = `${id}-${base}`;
  }

  const { data, error } = await client
    .from("products")
    .update(payload)
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
