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
  if (auth.user.role === "admin" && !auth.user.storeId) {
    return NextResponse.json(
      { error: "Admin account is missing store assignment (storeId)." },
      { status: 400 }
    );
  }

  const body = await req.json();
  // Only Super Admin can assign role super_admin to a user.
  if (body.role === "super_admin" && auth.user.role !== "super_admin") {
    return NextResponse.json({ error: "Only Super Admin can assign Super Admin role" }, { status: 403 });
  }

  // Admins cannot change another user's store assignment at all (it must remain their own store).
  if (auth.user.role === "admin" && Object.prototype.hasOwnProperty.call(body, "storeId")) {
    if (body.storeId !== auth.user.storeId) {
      return NextResponse.json(
        { error: "Admins can only assign users to their own store" },
        { status: 403 }
      );
    }
  }

  // Validate final state: employees/admins must always have a storeId.
  const current = await storage.getUser(id);
  if (!current) return NextResponse.json({}, { status: 404 });
  const nextRole = body?.role ?? current.role;
  const nextStoreId = Object.prototype.hasOwnProperty.call(body, "storeId")
    ? body.storeId
    : current.storeId;
  if ((nextRole === "employee" || nextRole === "admin") && !nextStoreId) {
    return NextResponse.json(
      { error: "Employees/Admins must be assigned to a store (storeId is required)." },
      { status: 400 }
    );
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
