import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../server/storage/supabase.client";

/**
 * Simple search endpoint for store — returns product and category suggestions.
 * Query params:
 *   q - search term
 *   limit - optional limit per type (default 8)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const limit = parseInt(url.searchParams.get("limit") || "8", 10) || 8;

    if (q.length < 2) {
      return NextResponse.json({ products: [], categories: [] });
    }

    const sb = getSupabaseServer();
    if (!sb) return NextResponse.json({ products: [], categories: [] });

    // Products: search name, sku, description
    const { data: products, error: pErr } = await sb
      .from("products")
      .select("id,name,slug,sku,price,description")
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%,description.ilike.%${q}%`)
      .eq("deleted", false)
      .or("visibility.eq.online,visibility.eq.both")
      .limit(limit);
    if (pErr) throw pErr;

    // Categories: search by name
    const { data: categories, error: cErr } = await sb
      .from("categories")
      .select("id,name,slug")
      .ilike("name", `%${q}%`)
      .eq("visibility", "online")
      .eq("approval_status", "approved")
      .limit(limit);
    if (cErr) throw cErr;

    return NextResponse.json({ products: products ?? [], categories: categories ?? [] });
  } catch (error: unknown) {
    console.error("Store search error:", error);
    return NextResponse.json({ products: [], categories: [], error: "Search failed" }, { status: 500 });
  }
}
