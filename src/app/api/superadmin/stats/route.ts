import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireSuperAdmin } from "../../_lib/session";

/** Platform analytics for Super Admin only. */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json({}, { status: "forbidden" in auth && auth.forbidden ? 403 : 401 });
  }

  const users = await storage.getUsers();
  const totalMerchants = users.filter((u) => u.role === "admin").length;
  const totalSuperAdmins = users.filter((u) => u.role === "super_admin").length;

  const sales = await storage.getSales(false);
  const onlineOrders = sales.filter((s: { order_source?: string }) => s.order_source === "online");
  const posOrders = sales.filter((s: { order_source?: string }) => s.order_source === "pos" || !s.order_source);

  const pendingMerchantRequests = await storage.getMerchantRequests("pending");
  const categories = await storage.getCategories();
  const pendingCategories = categories.filter(
    (c: { approval_status?: string; approvalStatus?: string }) =>
      (c.approval_status ?? c.approvalStatus) === "pending"
  );

  return NextResponse.json({
    totalMerchants,
    totalSuperAdmins,
    activeStores: totalMerchants, // single store per merchant
    totalOnlineOrders: onlineOrders.length,
    totalPosOrders: posOrders.length,
    pendingMerchantRequests: pendingMerchantRequests.length,
    pendingCategoryRequests: pendingCategories.length,
  });
}
