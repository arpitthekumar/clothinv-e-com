import type { SupabaseServerClient } from "../supabase.client";

export async function createPayment(
  client: SupabaseServerClient,
  payment: any
) {
  // Normalize camelCase -> snake_case to avoid PostgREST schema errors
  const payload: any = {
    order_id: payment.order_id ?? payment.orderId ?? null,
    store_id: payment.store_id ?? payment.storeId ?? null,
    provider: payment.provider ?? null,
    order_provider_id: payment.order_provider_id ?? payment.orderProviderId ?? null,
    payment_id: payment.payment_id ?? payment.paymentId ?? null,
    status: payment.status ?? null,
    amount: payment.amount ?? null,
    method: payment.method ?? null,
    // include any other keys that may be present
    ...(payment.notes ? { notes: payment.notes } : {}),
  };

  // Idempotency: if payment_id or order_provider_id already exists, return existing
  if (payload.payment_id) {
    const { data: existingByPid, error: existingPidErr } = await client
      .from("payments")
      .select("*")
      .eq("payment_id", payload.payment_id)
      .maybeSingle();
    if (existingPidErr) throw existingPidErr;
    if (existingByPid) return existingByPid as any;
  }
  if (payload.order_provider_id) {
    const { data: existingByOpid, error: existingOpidErr } = await client
      .from("payments")
      .select("*")
      .eq("order_provider_id", payload.order_provider_id)
      .maybeSingle();
    if (existingOpidErr) throw existingOpidErr;
    if (existingByOpid) return existingByOpid as any;
  }

  const { data, error } = await client
    .from("payments")
    .insert(payload)
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
