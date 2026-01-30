import type { SupabaseServerClient } from "../supabase.client";
import type {
  MerchantRequest,
  InsertMerchantRequest,
} from "@shared/schema";

export async function getMerchantRequests(
  client: SupabaseServerClient,
  status?: "pending" | "approved" | "rejected"
): Promise<MerchantRequest[]> {
  let query = client.from("merchant_requests").select("*").order("created_at", {
    ascending: false,
  });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MerchantRequest[];
}

export async function createMerchantRequest(
  client: SupabaseServerClient,
  data: InsertMerchantRequest
): Promise<MerchantRequest> {
  const payload = {
    user_id: data.userId,
    shop_name: data.shopName,
    address: data.address ?? null,
    business_details: data.businessDetails ?? null,
    status: "pending",
  };
  const { data: row, error } = await client
    .from("merchant_requests")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return row as MerchantRequest;
}

export async function updateMerchantRequest(
  client: SupabaseServerClient,
  id: string,
  data: { status: string; reviewedBy?: string }
): Promise<MerchantRequest | undefined> {
  const payload: Record<string, unknown> = { status: data.status };
  if (data.reviewedBy !== undefined) payload.reviewed_by = data.reviewedBy;
  if (data.status !== "pending") payload.reviewed_at = new Date().toISOString();
  const { data: row, error } = await client
    .from("merchant_requests")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (row ?? undefined) as MerchantRequest | undefined;
}
