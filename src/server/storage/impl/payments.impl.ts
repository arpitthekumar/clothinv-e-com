import type { SupabaseServerClient } from "../supabase.client";

export async function createPayment(
  client: SupabaseServerClient,
  payment: any
) {
  // Normalize camelCase -> snake_case to avoid PostgREST schema errors
  const payload: any = {
    order_id: payment.order_id ?? payment.orderId ?? null,
    sale_id: payment.sale_id ?? payment.saleId ?? null,
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

  // If sale_id was not provided, but we have an order_id, attempt to derive a sale_id
  // by finding a sale that was created when the order was processed (heuristic).
  if (!payload.sale_id && payload.order_id) {
    try {
      const { data: ord } = await client.from("orders").select("processed_at, total_amount, customer_phone, customer_id").eq("id", payload.order_id).maybeSingle();
      if (ord && ord.processed_at) {
        // look for sales created at/after processed_at with the same total_amount and same customer
        const q = client.from("sales").select("id, total_amount, created_at, customer_phone, customer_id").gte("created_at", ord.processed_at).eq("total_amount", ord.total_amount).limit(5);
        const { data: matches } = await q;
        if (matches && matches.length > 0) {
          // pick most recent
          const chosen = matches.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          if (chosen) payload.sale_id = chosen.id;
        }
      }
    } catch (e) {
      // ignore — this is a best-effort heuristic
    }
  }

  // If store_id is missing but we have an order id, try to derive store_id from the order
  if (!payload.store_id && payload.order_id) {
    try {
      const { data: ord } = await client.from("orders").select("store_id").eq("id", payload.order_id).maybeSingle();
      if (ord && ord.store_id) payload.store_id = ord.store_id;
    } catch (e) {
      // ignore
    }
  }

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
