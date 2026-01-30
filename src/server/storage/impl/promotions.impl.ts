import type { SupabaseServerClient } from "../supabase.client";

export async function getPromotions(client: SupabaseServerClient) {
  const { data, error } = await client
    .from("promotions")
    .select("*")
    .eq("active", true);
  if (error) throw error;
  return data as any;
}

export async function createPromotion(
  client: SupabaseServerClient,
  promo: any
) {
  const { data, error } = await client
    .from("promotions")
    .insert(promo)
    .select("*")
    .single();
  if (error) throw error;
  return data as any;
}

export async function addPromotionTarget(
  client: SupabaseServerClient,
  target: any
) {
  const { data, error } = await client
    .from("promotion_targets")
    .insert(target)
    .select("*")
    .single();
  if (error) throw error;
  return data as any;
}

export async function getPromotionTargets(client: SupabaseServerClient) {
  const { data, error } = await client
    .from("promotion_targets")
    .select("*");
  if (error) throw error;
  return data as any[];
}
