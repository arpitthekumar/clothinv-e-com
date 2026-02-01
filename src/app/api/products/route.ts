import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertProductSchema } from "@shared/schema";
import { mapProductToDb, mapProductFromDb } from "@/lib/db-column-mapper";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "true";

  // Scope: admin/employee should only see their store's products.
  // Super Admin can see all products.
  let products: any[] = [];
  if (auth.user.role === "admin" || auth.user.role === "employee") {
    if (!auth.user.storeId) {
      return NextResponse.json(
        { error: "Your account is missing store assignment (storeId)." },
        { status: 400 }
      );
    }
    // Admin should see all products for their store (including offline) when managing inventory
    products = await storage.getProductsForStore(auth.user.storeId, undefined, { includeDeleted: includeDeleted, includeOffline: true });
  } else {
    products = await storage.getProducts(includeDeleted);
  }
  const mappedProducts = (products || []).map(mapProductFromDb);
  return NextResponse.json(mappedProducts);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  // Employee: no product creation. Admin/Super Admin only.
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") {
    return NextResponse.json({}, { status: 403 });
  }
  if (auth.user.role === "admin" && !auth.user.storeId) {
    return NextResponse.json(
      { error: "Admin account is missing store assignment (storeId)." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    
    // Clean up buyingPrice: remove it if empty
    if (body.buyingPrice !== undefined) {
      if (body.buyingPrice === "" || body.buyingPrice === null) {
        delete body.buyingPrice;
      }
    }
    
    // Clean up other optional fields
    if (body.description === "") body.description = null;
    if (body.size === "") body.size = null;
    if (body.barcode === "") body.barcode = null;
    if (body.categoryId === "") body.categoryId = null;
    
    const data = insertProductSchema.parse(body);

    // If image is a base64 payload, compress & upload to storage and replace with short path
    if (data.image && typeof data.image === "string" && data.image.startsWith("data:")) {
      try {
        const path = await storage.uploadImage(data.image, auth.user.storeId ?? null);
        data.image = path; // store short path in DB
      } catch (err: any) {
        console.error("Image upload failed:", err);
        const details = err?.message ?? JSON.stringify(err);
        return NextResponse.json({ error: "Failed to upload image", details }, { status: 400 });
      }
    }

    // Map all fields to database column names
    const dbData = mapProductToDb({
      ...data,
      // Admin products are always scoped to their store.
      ...(auth.user.role === "admin" ? { storeId: auth.user.storeId } : {}),
    });

    // Check if barcode is unique if provided
    if (dbData.barcode) {
      const existingProduct = await storage.getProductByBarcode(dbData.barcode);
      if (existingProduct && !existingProduct.deleted) {
        return NextResponse.json(
          { error: "Barcode already exists" },
          { status: 400 }
        );
      }
    }

    // Log what we're sending for debugging
    console.log("Creating product with data:", JSON.stringify(dbData, null, 2));
    
    const product = await storage.createProduct(dbData);
    const mappedProduct = mapProductFromDb(product);
    return NextResponse.json(mappedProduct, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    const errorMessage = error.message || "Invalid product data";
    
    if (error.message?.includes("unique")) {
      return NextResponse.json(
        { error: "SKU or barcode already exists" },
        { status: 400 }
      );
    }
    
    // Provide helpful error message for schema issues
    if (error.code === 'PGRST204') {
      return NextResponse.json(
        { 
          error: "Database schema mismatch. Please run the migration script 'fix-product-columns.sql' in your Supabase SQL editor to fix column names.",
          details: errorMessage
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    const deleted = await storage.softDeleteProduct(id);
    if (!deleted) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ message: "Product moved to trash" });
  } catch (error: any) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
