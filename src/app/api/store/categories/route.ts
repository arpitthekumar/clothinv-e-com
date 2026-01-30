import { NextResponse } from "next/server";
import { storage } from "@server/storage";

/** Public: categories visible on store (visibility=online, approval_status=approved). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId") || undefined;
    const categories = await storage.getCategoriesForStore(storeId);
    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error("Store categories error:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
