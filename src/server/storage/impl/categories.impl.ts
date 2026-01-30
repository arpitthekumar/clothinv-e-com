import type { SupabaseServerClient } from "../supabase.client";
import type { Category, InsertCategory } from "@shared/schema";

export async function getCategories(
  client: SupabaseServerClient
): Promise<Category[]> {
  const { data, error } = await client.from("categories").select("*");
  if (error) throw error;
  return data as Category[];
}

export async function getCategoriesForStore(
  client: SupabaseServerClient
): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("visibility", "online")
    .eq("approval_status", "approved");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(
  client: SupabaseServerClient,
  category: InsertCategory
): Promise<Category> {
  const payload = {
    id: crypto.randomUUID(),
    name: category.name,
    description: category.description ?? null,
    color: category.color ?? "white",
    visibility: (category as any).visibility ?? "offline",
    approval_status: (category as any).approvalStatus ?? "approved",
  };
  const { data, error } = await client
    .from("categories")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  client: SupabaseServerClient,
  id: string,
  category: Partial<InsertCategory>
): Promise<Category | undefined> {
  const payload: any = { ...category };
  if (payload.approvalStatus !== undefined) {
    payload.approval_status = payload.approvalStatus;
    delete payload.approvalStatus;
  }
  if (category.color === undefined) delete payload.color;
  const { data, error } = await client
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Category | undefined;
}

export async function deleteCategory(
  client: SupabaseServerClient,
  id: string
): Promise<boolean> {
  const { error } = await client.from("categories").delete().eq("id", id);
  if (error) throw error;
  return true;
}
