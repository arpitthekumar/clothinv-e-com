import type { SupabaseServerClient } from "../supabase.client";

export interface StoreRow {
  id: string;
  name: string;
  owner_id: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
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

export async function getStoreById(
  client: SupabaseServerClient,
  id: string
): Promise<StoreRow | undefined> {
  const { data, error } = await client
    .from("stores")
    .select("id, name, owner_id, address_line1, address_line2, city, state, postcode, country, latitude, longitude, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as StoreRow | undefined;
}

export async function updateStore(
  client: SupabaseServerClient,
  id: string,
  patch: Partial<{
    name?: string;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postcode?: string | null;
    country?: string | null;
    latitude?: string | null;
    longitude?: string | null;
  }>
): Promise<StoreRow | undefined> {
  const payload: any = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.addressLine1 !== undefined) payload.address_line1 = patch.addressLine1;
  if (patch.addressLine2 !== undefined) payload.address_line2 = patch.addressLine2;
  if (patch.city !== undefined) payload.city = patch.city;
  if (patch.state !== undefined) payload.state = patch.state;
  if (patch.postcode !== undefined) payload.postcode = patch.postcode;
  if (patch.country !== undefined) payload.country = patch.country;
  if (patch.latitude !== undefined) payload.latitude = patch.latitude;
  if (patch.longitude !== undefined) payload.longitude = patch.longitude;

  const { data, error } = await client.from("stores").update(payload).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as StoreRow | undefined;
}
