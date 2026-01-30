import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { mapProductFromDb } from "@/lib/db-column-mapper";

/** Public: products visible on e-commerce store (visibility online or both). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId") || undefined;
    const products = await storage.getProductsForStore(storeId);
    const mapped = (products ?? []).map(mapProductFromDb);
    return NextResponse.json(mapped);
  } catch (error: unknown) {
    console.error("Store products error:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}
