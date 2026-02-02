import { NextResponse } from "next/server";
import { SupabaseStorage } from "@/server/storage/storage.service";
import { isUsingServiceRole } from "@/server/storage/supabase.client";

function slugify(input: string) {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  // Protected by same migration secret used for other debug migrations
  const secret = req.headers.get("x-migrate-secret") || new URL(req.url).searchParams.get("secret");
  const expected = process.env.MIGRATE_IMAGES_SECRET;
  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized: provide the MIGRATE_IMAGES_SECRET via x-migrate-secret header or ?secret= query param." }, { status: 401 });
  }

  if (!isUsingServiceRole()) {
    return NextResponse.json({ error: "Supabase service role key is required to run migration. Set SUPABASE_SERVICE_ROLE_KEY in server env and restart." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun: boolean = Boolean(body?.dryRun);
  const batchSize: number = Number(body?.batchSize ?? 100) || 100;
  const doSales: boolean = body?.doSales ?? true;
  const doProducts: boolean = body?.doProducts ?? true;

  const storage = new SupabaseStorage();
  const client: any = (storage as any).client; // supabase server client

  const summary: any = {
    sales: { total: 0, processed: 0, failed: [], sample: [] },
    products: { total: 0, processed: 0, failed: [], sample: [] },
  };

  if (doSales) {
    // Backfill sales.store_id where null
    while (true) {
      const { data: sales, error } = await client
        .from("sales")
        .select("id, items")
        .is("store_id", null)
        .limit(batchSize);
      if (error) return NextResponse.json({ error: error.message || error.toString() }, { status: 500 });
      if (!sales || sales.length === 0) break;
      summary.sales.total += sales.length;

      for (const s of sales) {
        try {
          const items = s.items || [];
          const productIds = Array.from(new Set((items || []).map((it: any) => it.productId).filter(Boolean)));
          if (productIds.length === 0) {
            summary.sales.failed.push({ id: s.id, reason: "no products in sale items" });
            continue;
          }

          // fetch product store_ids
          const { data: products } = await client.from("products").select("id,store_id").in("id", productIds).limit(100);
          const stores = products?.map((p: any) => p.store_id).filter(Boolean) ?? [];
          if (stores.length === 0) {
            summary.sales.failed.push({ id: s.id, reason: "no product store_id found" });
            continue;
          }

          // pick most common store_id among products
          const counts: Record<string, number> = {};
          for (const st of stores) counts[st] = (counts[st] || 0) + 1;
          const chosen = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

          if (!chosen) {
            summary.sales.failed.push({ id: s.id, reason: "ambiguous store_id" });
            continue;
          }

          if (!dryRun) {
            const { error: updErr } = await client.from("sales").update({ store_id: chosen }).eq("id", s.id);
            if (updErr) {
              summary.sales.failed.push({ id: s.id, reason: updErr.message || updErr.toString() });
              continue;
            }
            summary.sales.processed += 1;
            if (summary.sales.sample.length < 20) summary.sales.sample.push({ id: s.id, store_id: chosen });
          } else {
            summary.sales.processed += 1;
            if (summary.sales.sample.length < 20) summary.sales.sample.push({ id: s.id, store_id: chosen });
          }
        } catch (err: any) {
          summary.sales.failed.push({ id: s.id, reason: err?.message || err?.toString() });
        }
      }

      // If doing dryRun just run one batch
      if (dryRun) break;
    }
  }

  if (doProducts) {
    // Backfill product slugs to id-prefixed format when missing or not id-prefixed
    while (true) {
      const { data: products, error } = await client
        .from("products")
        .select("id,name,slug,store_id")
        .limit(batchSize);
      if (error) return NextResponse.json({ error: error.message || error.toString() }, { status: 500 });
      if (!products || products.length === 0) break;

      const candidates = (products || []).filter((p: any) => {
        // if slug missing or not starting with `${id}-`
        if (!p.slug || String(p.slug).trim() === "") return true;
        return !String(p.slug).startsWith(`${p.id}-`);
      });

      if (candidates.length === 0) break;

      summary.products.total += candidates.length;

      for (const p of candidates) {
        try {
          const base = slugify(p.name || p.id);
          let attempt = `${p.id}-${base}`;
          let suffix = 1;
          // ensure unique slug within store scope
          while (true) {
            let q = client.from("products").select("id").eq("slug", attempt).limit(1);
            if (p.store_id) q = q.eq("store_id", p.store_id);
            const { data: exists } = await q;
            if (!exists || (exists as any).length === 0) break;
            attempt = `${p.id}-${base}-${suffix++}`;
          }

          if (!dryRun) {
            const { error: updErr } = await client.from("products").update({ slug: attempt }).eq("id", p.id);
            if (updErr) {
              summary.products.failed.push({ id: p.id, reason: updErr.message || updErr.toString() });
              continue;
            }
            summary.products.processed += 1;
            if (summary.products.sample.length < 20) summary.products.sample.push({ id: p.id, oldSlug: p.slug, newSlug: attempt });
          } else {
            summary.products.processed += 1;
            if (summary.products.sample.length < 20) summary.products.sample.push({ id: p.id, oldSlug: p.slug, newSlug: attempt });
          }
        } catch (err: any) {
          summary.products.failed.push({ id: p.id, reason: err?.message || err?.toString() });
        }
      }

      if (dryRun) break;
    }
  }

  return NextResponse.json({ message: dryRun ? "Dry run complete" : "Backfill complete", summary });
}
