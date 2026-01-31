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

  // Enrich with store names for display and ensure createdAt is present
  const stores = await storage.getStores();
  const storeMap: Record<string, string> = {};
  for (const s of stores) storeMap[s.id] = s.name;
  const enriched = (users as any[]).map((u) => ({
    ...u,
    storeName: u.storeId ? storeMap[u.storeId] ?? u.storeId : null,
    // createdAt mapping should already exist from storage; keep it safe
    createdAt: u.createdAt ?? u.created_at ?? null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") return NextResponse.json({}, { status: 403 });
  if (auth.user.role === "admin" && !auth.user.storeId) {
    return NextResponse.json(
      { error: "Admin account is missing store assignment (storeId)." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const data = insertUserSchema.parse(body);

    // Only Super Admin can create another Super Admin.
    if (data.role === "super_admin" && auth.user.role !== "super_admin") {
      return NextResponse.json({ error: "Only Super Admin can create a Super Admin" }, { status: 403 });
    }

    // Admin adds users to their store automatically.
    const createPayload: any = { ...data, password: data.password };
    if (auth.user.role === "admin") {
      createPayload.storeId = auth.user.storeId;
    }

    // Enforce: employees must always have a store.
    const effectiveRole = createPayload.role;
    const effectiveStoreId = createPayload.storeId;
    if ((effectiveRole === "employee" || effectiveRole === "admin") && !effectiveStoreId) {
      return NextResponse.json(
        { error: "Employees/Admins must be assigned to a store (storeId is required)." },
        { status: 400 }
      );
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
