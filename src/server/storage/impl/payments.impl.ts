import type { SupabaseServerClient } from "../supabase.client";

export async function createPayment(
  client: SupabaseServerClient,
  payment: any
) {
  const { data, error } = await client
    .from("payments")
    .insert(payment)
    .select("*")
    .single();
  if (error) throw error;
  return data as any;
}

export async function updatePayment(
  client: SupabaseServerClient,
  id: string,
  dataPatch: any
) {
  const { data, error } = await client
    .from("payments")
    .update(dataPatch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as any;
}
