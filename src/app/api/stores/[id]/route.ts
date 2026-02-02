import { NextResponse } from "next/server";
import { SupabaseStorage } from "@/server/storage/storage.service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const storage = new SupabaseStorage();
    const s = await storage.getStoreById(id);
    if (!s) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    return NextResponse.json(s);
  } catch (err: unknown) {
    console.error("Store API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}