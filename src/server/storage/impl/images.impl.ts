import type { SupabaseServerClient } from "../supabase.client";
import sharp from "sharp";
import crypto from "crypto";
import { isUsingServiceRole } from "../supabase.client";

/**
 * Uploads a base64 image, compresses it with sharp, and stores it in the
 * `product-images` bucket. Returns the short object path (bucket-relative)
 * e.g., "<storeId>/1631231231-uuid.jpg" or just "16312-uuid.jpg" when no store.
 */
export async function uploadBase64Image(
  client: SupabaseServerClient,
  base64Data: string,
  storeId?: string | null
): Promise<string> {
  if (!base64Data || !base64Data.startsWith("data:")) {
    throw new Error("Invalid base64 image data");
  }

  if (!isUsingServiceRole()) {
    throw new Error(
      "Server-side image uploads require the Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY in your server env."
    );
  }

  const matches = base64Data.match(/^data:(image\/(\w+));base64,(.+)$/);
  if (!matches) throw new Error("Invalid image data URI");
  const mime = matches[1];
  const extCandidate = matches[2] || "jpg";
  const b64 = matches[3];
  const buffer = Buffer.from(b64, "base64");

  // Compress/resize for reasonable sizes (max width 1200) and convert to JPEG
  const optimized = await sharp(buffer).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();

  const filename = `${Date.now()}-${crypto.randomUUID()}.jpg`;
  const objectPath = storeId ? `${storeId}/${filename}` : filename;

  // Upload
  const bucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

  const doUpload = async () => {
    return await client.storage.from(bucket).upload(objectPath, optimized, {
      contentType: "image/jpeg",
      upsert: true,
    });
  };

  let { error: uploadError } = await doUpload();

  // If bucket doesn't exist, try creating it (requires service role key)
  if (uploadError && ((((uploadError as any)?.statusCode) === "404") || ((uploadError as any)?.status === 404) || (uploadError?.message || "").toLowerCase().includes("bucket not found"))) {
    console.warn(`Bucket "${bucket}" not found; attempting to create it...`);
    try {
      const { error: createErr } = await client.storage.createBucket(bucket, { public: true });
      if (createErr) {
        console.error("Failed to create bucket:", createErr);
        throw new Error(createErr.message || JSON.stringify(createErr));
      }
      // retry upload
      ({ error: uploadError } = await doUpload());
    } catch (err: any) {
      console.error("Bucket creation/upload retry failed:", err);
      throw new Error(err?.message || String(err));
    }
  }

  if (uploadError) {
    console.error("Image upload failed:", uploadError);
    throw new Error(uploadError.message || JSON.stringify(uploadError));
  }

  // Returning the short object path is intentional (store only a short string in DB)
  return objectPath;
}
