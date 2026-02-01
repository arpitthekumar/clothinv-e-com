import { getSupabaseServer } from "@/server/storage/supabase.client";
import { SupabaseStorage } from "@/server/storage/storage.service";
import { mapProductFromDb } from "@/lib/db-column-mapper";
import ProductDetailClient from "@/components/store/product-detail-client";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const storage = new SupabaseStorage();
  // Fetch all visible store products and find by slug or id
  const products = await storage.getProductsForStore(undefined);
  const p = (products || []).find((x: any) => x.slug === params.slug || x.id === params.slug);
  if (!p) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const product = mapProductFromDb(p);
  // Ensure image URL is public when stored path
  try {
    const { getPublicImageUrl } = await import("@/lib/media");
    if (product.image && !product.image.startsWith("data:") && !product.image.startsWith("http")) {
      product.image = getPublicImageUrl(product.image) || product.image;
    }
  } catch (e) {
    // ignore
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <ProductDetailClient product={product} />
      </div>
    </div>
  );
}
