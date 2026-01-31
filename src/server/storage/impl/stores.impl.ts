import type { SupabaseServerClient } from "../supabase.client";

export interface StoreRow {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
}

export async function createStore(
  client: SupabaseServerClient,
  payload: { name: string; ownerId: string }
): Promise<StoreRow> {
  const { data, error } = await client
    .from("stores")
    .insert({
      id: crypto.randomUUID(),
      name: payload.name,
      owner_id: payload.ownerId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as StoreRow;
}

export async function getStoreByOwnerId(
  client: SupabaseServerClient,
  ownerId: string
): Promise<StoreRow | undefined> {
  const { data, error } = await client
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as StoreRow | undefined;
}

export async function getStores(
  client: SupabaseServerClient
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await client.from("stores").select("id, name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}
