import type { SupabaseServerClient } from "../supabase.client";

export async function getPromotions(client: SupabaseServerClient, storeId?: string) {
  let q = client.from("promotions").select("*").eq("active", true);
  if (storeId) q = q.eq("store_id", storeId);
  const { data, error } = await q;
  if (error) throw error;
  return data as any;
}

export async function createPromotion(
  client: SupabaseServerClient,
  promo: any
) {
  const payload: any = { ...promo };
  if (payload.storeId !== undefined) {
    payload.store_id = payload.storeId;
    delete payload.storeId;
  }
  const { data, error } = await client
    .from("promotions")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as any;
}

export async function addPromotionTarget(
  client: SupabaseServerClient,
  target: any
) {
  const payload: any = { ...target };
  if (payload.storeId !== undefined) {
    payload.store_id = payload.storeId;
    delete payload.storeId;
  }
  const { data, error } = await client
    .from("promotion_targets")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as any;
}

export async function getPromotionTargets(client: SupabaseServerClient, storeId?: string) {
  let q = client.from("promotion_targets").select("*");
  if (storeId) q = q.eq("store_id", storeId);
  const { data, error } = await q;
  if (error) throw error;
  return data as any[];
}
