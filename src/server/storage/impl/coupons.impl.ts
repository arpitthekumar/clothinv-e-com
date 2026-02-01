import type { SupabaseServerClient } from "../supabase.client";

export async function getDiscountCoupons(client: SupabaseServerClient, storeId?: string) {
  let q = client
    .from("discount_coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (storeId) q = q.eq("store_id", storeId);
  const { data, error } = await q;
  if (error) throw error;
  return data as import("@shared/schema").DiscountCoupon[];
}

export async function createDiscountCoupon(
  client: SupabaseServerClient,
  coupon: import("@shared/schema").InsertDiscountCoupon
) {
  const payload: any = {
    name: (coupon as any).name,
    percentage: (coupon as any).percentage,
    active: (coupon as any).active,
    created_by: (coupon as any).createdBy,
  };
  if ((coupon as any).storeId !== undefined) payload.store_id = (coupon as any).storeId;
  const { data, error } = await client
    .from("discount_coupons")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as import("@shared/schema").DiscountCoupon;
}

export async function getDiscountCouponByName(
  client: SupabaseServerClient,
  name: string
) {
  const { data, error } = await client
    .from("discount_coupons")
    .select("*")
    .eq("name", name)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as
    | import("@shared/schema").DiscountCoupon
    | undefined;
}

export async function updateDiscountCoupon(
  client: SupabaseServerClient,
  id: string,
  coupon: Partial<import("@shared/schema").InsertDiscountCoupon>
) {
  const payload: any = {};
  if ((coupon as any).name !== undefined) payload.name = (coupon as any).name;
  if ((coupon as any).percentage !== undefined)
    payload.percentage = (coupon as any).percentage;
  if ((coupon as any).active !== undefined)
    payload.active = (coupon as any).active;
  if ((coupon as any).createdBy !== undefined)
    payload.created_by = (coupon as any).createdBy;
  const { data, error } = await client
    .from("discount_coupons")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as
    | import("@shared/schema").DiscountCoupon
    | undefined;
}

export async function deleteDiscountCoupon(
  client: SupabaseServerClient,
  id: string
): Promise<boolean> {
  const { error } = await client
    .from("discount_coupons")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
