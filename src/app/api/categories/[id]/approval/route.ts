import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireSuperAdmin } from "../../../_lib/session";

/** PATCH: Super Admin approve/reject category for online visibility. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      {},
      { status: "forbidden" in auth && auth.forbidden ? 403 : 401 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const approvalStatus = body.approvalStatus as string;
    if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
      return NextResponse.json(
        { error: "approvalStatus must be pending, approved, or rejected" },
        { status: 400 }
      );
    }

    const updated = await storage.updateCategory(id, {
      approvalStatus: approvalStatus as "pending" | "approved" | "rejected",
    });
    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
