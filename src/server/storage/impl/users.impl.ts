import type { SupabaseServerClient } from "../supabase.client";
import type { User, InsertUser } from "@shared/schema";

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
  return (data ?? undefined) as User | undefined;
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
  return (data ?? undefined) as User | undefined;
}

export async function createUser(
  client: SupabaseServerClient,
  user: InsertUser
): Promise<User> {
  const { data, error } = await client
    .from("users")
    .insert(user)
    .select("*")
    .single();
  if (error) throw error;
  return data as User;
}

export async function updateUser(
  client: SupabaseServerClient,
  id: string,
  user: Partial<InsertUser>
): Promise<User | undefined> {
  const { data, error } = await client
    .from("users")
    .update(user)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as User | undefined;
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
  return data as User[];
}
