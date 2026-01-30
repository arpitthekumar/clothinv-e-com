import type { SupabaseServerClient } from "../supabase.client";
import type { StockMovement, InsertStockMovement } from "@shared/schema";

export async function getStockMovements(
  client: SupabaseServerClient
): Promise<StockMovement[]> {
  const { data, error } = await client
    .from("stock_movements")
    .select("*");
  if (error) throw error;
  return data as StockMovement[];
}

export async function getStockMovementsByProduct(
  client: SupabaseServerClient,
  productId: string
): Promise<StockMovement[]> {
  const { data, error } = await client
    .from("stock_movements")
    .select("*")
    .eq("product_id", productId);
  if (error) throw error;
  return data as StockMovement[];
}

export async function createStockMovement(
  client: SupabaseServerClient,
  movement: InsertStockMovement
): Promise<StockMovement> {
  const payload: any = {
    product_id: (movement as any).productId,
    user_id: (movement as any).userId,
    type: (movement as any).type,
    quantity: (movement as any).quantity,
    reason: (movement as any).reason,
    ref_table: (movement as any).refTable,
    ref_id: (movement as any).refId,
  };
  const { data, error } = await client
    .from("stock_movements")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as StockMovement;
}
