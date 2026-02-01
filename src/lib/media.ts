export function getPublicImageUrl(image?: string | null, bucket = "product-images"): string | null {
  if (!image) return null;
  if (image.startsWith("data:") || image.startsWith("http")) return image;

  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  if (!base) return image; // fallback
  return `${base}/storage/v1/object/public/${bucket}/${encodeURIComponent(image)}`;
}
