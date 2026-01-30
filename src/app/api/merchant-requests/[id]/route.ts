import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireSuperAdmin } from "../../_lib/session";

/** PATCH: Super Admin approve/reject merchant request. Approved → user role set to admin. */
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
    const status = body.status as string;
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be approved or rejected" },
        { status: 400 }
      );
    }

    const updated = await storage.updateMerchantRequest(id, {
      status,
      reviewedBy: auth.user.id,
    });
    if (!updated) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (status === "approved") {
      const userId = (updated as { userId?: string; user_id?: string }).userId
        ?? (updated as { user_id?: string }).user_id;
      const shopName = (updated as { shop_name?: string }).shop_name ?? "My Store";
      if (userId) {
        try {
          const store = await storage.createStore({ name: shopName, ownerId: userId });
          await storage.updateUser(userId, { role: "admin", storeId: store.id });
        } catch (e) {
          await storage.updateUser(userId, { role: "admin" });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
