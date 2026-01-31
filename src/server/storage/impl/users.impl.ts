import type { SupabaseServerClient } from "../supabase.client";
import type { User, InsertUser } from "@shared/schema";

function mapFromDb(row: any): any {
  if (!row) return row;
  const out = { ...row };
  if (row.store_id !== undefined) {
    out.storeId = row.store_id;
    delete out.store_id;
  }
  if (row.full_name !== undefined) {
    out.fullName = row.full_name;
    delete out.full_name;
  }
  if (row.auth_uid !== undefined) {
    out.authUid = row.auth_uid;
    delete out.auth_uid;
  }
  return out;
}

function toDbUser(u: Record<string, unknown>): Record<string, unknown> {
  const db: Record<string, unknown> = { ...u };
  if (db.storeId !== undefined) {
    db.store_id = db.storeId;
    delete db.storeId;
  }
  if (db.fullName !== undefined) {
    db.full_name = db.fullName;
    delete db.fullName;
  }
  if ((db as any).authUid !== undefined) {
    (db as any).auth_uid = (db as any).authUid;
    delete (db as any).authUid;
  }
  return db;
}

export async function getUser(
  client: SupabaseServerClient,
  id: string
): Promise<User | undefined> {
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? (mapFromDb(data) as User) : undefined;
}

export async function getUserByUsername(
  client: SupabaseServerClient,
  username: string
): Promise<User | undefined> {
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data ? (mapFromDb(data) as User) : undefined;
}

import { ensureServiceRole } from "../supabase.client";

export async function createUser(
  client: SupabaseServerClient,
  user: InsertUser
): Promise<User> {
  // Ensure we are running with the service-role key on the server for user creation
  ensureServiceRole();

  const payload = toDbUser(user as Record<string, unknown>);
  const { data, error } = await client
    .from("users")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    // Helpful guidance for permission errors (common when service role key not set)
    if ((error as any).code === "42501" || /permission denied/.test((error as any).message ?? "")) {
      throw new Error(
        "Database permission denied. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your server environment and restart the dev server."
      );
    }
    throw error;
  }
  return mapFromDb(data) as User;
}

export async function updateUser(
  client: SupabaseServerClient,
  id: string,
  user: Partial<InsertUser>
): Promise<User | undefined> {
  const payload = toDbUser(user as Record<string, unknown>);
  const { data, error } = await client
    .from("users")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ? mapFromDb(data) : undefined) as User | undefined;
}

export async function deleteUser(
  client: SupabaseServerClient,
  id: string
): Promise<boolean> {
  const { error } = await client.from("users").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function getUsers(
  client: SupabaseServerClient
): Promise<User[]> {
  const { data, error } = await client.from("users").select("*");
  if (error) throw error;
  return (data ?? []).map(mapFromDb) as User[];
}

export async function getUsersByStore(
  client: SupabaseServerClient,
  storeId: string
): Promise<User[]> {
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("store_id", storeId);
  if (error) throw error;
  return (data ?? []).map(mapFromDb) as User[];
}
