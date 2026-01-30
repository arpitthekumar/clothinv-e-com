import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../../_lib/session";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") return NextResponse.json({}, { status: 403 });

  const body = await req.json();
  // Only Super Admin can assign role super_admin to a user.
  if (body.role === "super_admin" && auth.user.role !== "super_admin") {
    return NextResponse.json({ error: "Only Super Admin can assign Super Admin role" }, { status: 403 });
  }

  const user = await storage.updateUser(id, body);
  if (!user) return NextResponse.json({}, { status: 404 });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") return NextResponse.json({}, { status: 403 });

  // Only Super Admin can delete another Super Admin.
  const target = await storage.getUser(id);
  if (target?.role === "super_admin" && auth.user.role !== "super_admin") {
    return NextResponse.json({ error: "Only Super Admin can delete a Super Admin" }, { status: 403 });
  }

  const ok = await storage.deleteUser(id);
  if (!ok) return NextResponse.json({}, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
