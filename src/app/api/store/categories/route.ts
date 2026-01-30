import { NextResponse } from "next/server";
import { storage } from "@server/storage";

/** Public: categories visible on store (visibility=online, approval_status=approved). */
export async function GET() {
  try {
    const categories = await storage.getCategoriesForStore();
    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error("Store categories error:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
