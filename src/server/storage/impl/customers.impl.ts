import type { SupabaseServerClient } from "../supabase.client";
import type { Customer, InsertCustomer } from "@shared/schema";

export async function getCustomerByUser(
  client: SupabaseServerClient,
  userId: string
): Promise<Customer | undefined> {
  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as Customer) : undefined;
}

export async function createCustomer(
  client: SupabaseServerClient,
  customer: InsertCustomer & { userId?: string }
): Promise<Customer> {
  const payload: Record<string, unknown> = {
    user_id: (customer as any).userId ?? null,
    name: customer.name,
    phone: (customer as any).phone ?? null,
    email: (customer as any).email ?? null,
  };
  const { data, error } = await client
    .from("customers")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as Customer;
}
