import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertCategorySchema } from "@shared/schema";
import { mapProductFromDb } from "@/lib/db-column-mapper";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const categories = await storage.getCategories();

  // Super admin sees everything; store admins/employees see approved online categories + their store's categories
  if (auth.user.role === "super_admin") {
    return NextResponse.json(categories);
  }

  const filtered = (categories ?? []).filter((c: any) => {
    const approval = c.approval_status ?? c.approvalStatus ?? "approved";
    const visibility = c.visibility;
    const storeId = c.store_id ?? c.storeId ?? null;
    const isOnlineVisible = visibility === "online" && approval === "approved";
    const isOwnStore = storeId && storeId === auth.user.storeId;
    return isOnlineVisible || isOwnStore;
  });

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  // Employee: no category creation. Admin/Super Admin only.
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") {
    return NextResponse.json({}, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = insertCategorySchema.parse(body as any);

    // Enforce store-scoping and approval workflow for non-super_admins
    if (auth.user.role !== "super_admin") {
      // Force created category to belong to the user's store
      (data as any).storeId = auth.user.storeId ?? (data as any).storeId ?? null;
      // If they request online visibility, convert to pending approval and keep visibility offline
      if ((data as any).visibility === "online") {
        (data as any).approvalStatus = "pending";
        (data as any).visibility = "offline";
      }
    }

    const category = await storage.createCategory(data);
    return NextResponse.json(category, { status: 201 });
  } catch (err: any) {
    // If this is a Zod validation error, surface detailed issues
    if (err?.issues) {
      return NextResponse.json({ error: "Invalid category data", details: err.issues }, { status: 400 });
    }

    // If it's a DB error, return its message to help debugging
    return NextResponse.json({ error: err?.message ?? "Invalid category data" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  // Only admin/super_admin can delete. Employee cannot delete categories.
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") {
    return NextResponse.json({}, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("id");

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const existing = await storage.getCategory(categoryId);
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // If the category is a platform-wide/online category only super_admin may delete
    const visibility = existing.visibility;
    const storeId = (existing as any).store_id ?? existing.storeId ?? null;
    if (visibility === "online" && auth.user.role !== "super_admin") {
      return NextResponse.json({ error: "Only Super Admin may delete platform-wide online categories" }, { status: 403 });
    }

    // If it's a store-owned category, ensure the requester belongs to that store (unless super admin)
    if (storeId && auth.user.role !== "super_admin" && storeId !== auth.user.storeId) {
      return NextResponse.json({ error: "You may only delete categories belonging to your store" }, { status: 403 });
    }

    // Check if any products are using this category
    const productsRaw = await storage.getProducts(false); // Exclude deleted products
    const products = productsRaw.map(mapProductFromDb);
    const productsUsingCategory = products.filter(
      (p) => p.categoryId === categoryId
    );

    if (productsUsingCategory.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. ${productsUsingCategory.length} product(s) are using this category.`,
          productCount: productsUsingCategory.length,
        },
        { status: 400 }
      );
    }

    // Delete the category
    await storage.deleteCategory(categoryId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  // Allow admin, employee and super_admin to attempt updates; fine-grained checks below
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin" && auth.user.role !== "employee") {
    return NextResponse.json({}, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Ensure category exists and enforce per-category rules
    const existing = await storage.getCategory(id);
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const visibilityExisting = existing.visibility;
    const storeIdExisting = (existing as any).store_id ?? existing.storeId ?? null;

    // If the category is online, only super_admin can edit it
    if (visibilityExisting === "online" && auth.user.role !== "super_admin") {
      return NextResponse.json({ error: "Only Super Admin may edit online categories" }, { status: 403 });
    }

    // If it's store-owned, only staff/admin of that store (admin or employee) may edit
    if (storeIdExisting && auth.user.role !== "super_admin" && storeIdExisting !== auth.user.storeId) {
      return NextResponse.json({ error: "You may only edit categories belonging to your store" }, { status: 403 });
    }

    const data = insertCategorySchema.partial().parse(rest as any);

    // If a non-super_admin requests visibility=online, convert to a pending approval request instead
    if (auth.user.role !== "super_admin" && (data as any).visibility === "online") {
      (data as any).approvalStatus = "pending";
      delete (data as any).visibility; // don't flip visibility to online yet
    }

    const updatedCategory = await storage.updateCategory(id, data);

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update category" },
      { status: 400 }
    );
  }
}
