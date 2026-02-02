import { getSupabaseServer } from "@/server/storage/supabase.client";
import { SupabaseStorage } from "@/server/storage/storage.service";
import { mapProductFromDb } from "@/lib/db-column-mapper";
import ProductDetailClient from "@/components/store/product-detail-client";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = (await params) as { slug: string };
  const storage = new SupabaseStorage();
  // Fetch all visible store products and find by slug or id (support id-prefixed slugs like <id>-<name>)
  const products = await storage.getProductsForStore(undefined);
  let p: any;
  const uuidMatch = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(slug || "");
  if (uuidMatch) {
    const idPart = uuidMatch[1];
    p = (products || []).find((x: any) => x.id === idPart || x.slug === slug || x.id === slug);
  } else {
    p = (products || []).find((x: any) => x.slug === slug || x.id === slug);
  }
  if (!p) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const product = mapProductFromDb(p);

  // Fetch store name if available for display
  if (product.storeId) {
    try {
      const storeInfo = await storage.getStoreById(product.storeId);
      if (storeInfo) {
        product.storeName = storeInfo.name;
        // attach structured store location to product sent to client
        product.store = {
          id: storeInfo.id,
          name: storeInfo.name,
          addressLine1: storeInfo.address_line1 ?? null,
          addressLine2: storeInfo.address_line2 ?? null,
          city: storeInfo.city ?? null,
          state: storeInfo.state ?? null,
          postcode: storeInfo.postcode ?? null,
          country: storeInfo.country ?? null,
          latitude: storeInfo.latitude ?? null,
          longitude: storeInfo.longitude ?? null,
        };
      }
    } catch (e) {
      // ignore
    }
  }

  // Ensure image URL is public when stored path
  try {
    const { getPublicImageUrl } = await import("@/lib/media");
    if (product.image && !product.image.startsWith("data:") && !product.image.startsWith("http")) {
      product.image = getPublicImageUrl(product.image) || product.image;
    }
  } catch (e) {
    // ignore
  }

  // Fetch related products from same store
  let related: any[] = [];
  const storeId = (p as any).store_id ?? (p as any).storeId ?? undefined;
  if (storeId) {
    const raw = await storage.getProductsForStore(storeId as string);
    related = (raw || []).filter((r: any) => r.id !== p.id).slice(0, 8).map(mapProductFromDb);

    // ensure related images are public URLs when needed
    try {
      const { getPublicImageUrl } = await import("@/lib/media");
      related = related.map((rp: any) => {
        if (rp.image && !rp.image.startsWith("data:") && !rp.image.startsWith("http")) {
          rp.image = getPublicImageUrl(rp.image) || rp.image;
        }
        return rp;
      });
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-8 py-8 space-y-10 ">
        <ProductDetailClient product={product} related={related} />
      </div>
    </div>
  );
}
