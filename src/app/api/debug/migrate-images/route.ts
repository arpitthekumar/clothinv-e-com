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
  // This route is intentionally protected by an env secret to avoid accidental runs
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
  const batchSize: number = Number(body?.batchSize ?? 50) || 50;

  const storage = new SupabaseStorage();

  // Fetch all products and filter ones with base64 images
  const all = await storage.getProducts(true);
  const candidates = (all ?? []).filter((p: any) => typeof p.image === "string" && p.image.startsWith("data:"));

  if (candidates.length === 0) {
    return NextResponse.json({ message: "No products with base64 images found." });
  }

  const summary: any = { total: candidates.length, processed: 0, failed: [], sample: [] };

  // Process in batches to avoid memory spikes
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    for (const p of batch) {
      const beforeImage = p.image;
      const oldSlug = p.slug;
      try {
        if (dryRun) {
          summary.sample.push({ id: p.id, oldSlug, wouldUpload: true });
          continue;
        }
        // Upload image (compress + store short path)
        const newPath = await (storage as any).uploadImage(beforeImage, p.storeId ?? undefined);

        // Prepare slug if empty
        let newSlug = oldSlug;
        if (!newSlug || newSlug.trim() === "") {
          const base = slugify(p.name || p.id);
          let attempt = base;
          let suffix = 1;
          // Try updates until success (unique constraint per store)
          while (true) {
            try {
              // Attempt to update product with image + slug
              const updated = await storage.updateProduct(p.id, { image: newPath, slug: attempt });
              newSlug = attempt;
              break;
            } catch (err: any) {
              const msg = (err?.message || err?.toString() || "unknown error").toLowerCase();
              if (msg.includes("duplicate") || msg.includes("unique")) {
                // slug collision, try next
                attempt = `${base}-${suffix++}`;
                continue;
              }
              // Other errors -> propagate
              throw err;
            }
          }
        } else {
          // Slug exists, just update image
          await storage.updateProduct(p.id, { image: newPath });
        }

        summary.processed += 1;
        if (summary.sample.length < 20) summary.sample.push({ id: p.id, oldSlug, newSlug, newPath });
      } catch (err: any) {
        summary.failed.push({ id: p.id, error: err?.message || err?.toString() });
      }
    }
  }

  return NextResponse.json({ message: dryRun ? "Dry run complete" : "Migration complete", summary });
}
