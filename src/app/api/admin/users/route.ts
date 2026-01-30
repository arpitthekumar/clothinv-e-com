import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";
import { insertUserSchema } from "@shared/schema";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") return NextResponse.json({}, { status: 403 });
  const users =
    auth.user.role === "super_admin"
      ? await storage.getUsers()
      : auth.user.storeId
        ? await storage.getUsersByStore(auth.user.storeId)
        : [];
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const data = insertUserSchema.parse(body);

    // Only Super Admin can create another Super Admin.
    if (data.role === "super_admin" && auth.user.role !== "super_admin") {
      return NextResponse.json({ error: "Only Super Admin can create a Super Admin" }, { status: 403 });
    }

    // Admin adds users to their store only; Super Admin can set any store or omit.
    const createPayload = { ...data, password: data.password };
    if (auth.user.role === "admin" && auth.user.storeId) {
      (createPayload as any).storeId = auth.user.storeId;
    }

    // Check if username exists
    const existing = await storage.getUserByUsername(data.username);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const user = await storage.createUser(createPayload as any);

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
  }
}
