"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, Receipt, ShoppingCart, ShieldCheck, FolderClock } from "lucide-react";

function getQueryFn(url: string) {
  return async () => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };
}

export default function SuperAdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/superadmin/stats"],
    queryFn: getQueryFn("/api/superadmin/stats"),
  });

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Super Admin Dashboard"
          subtitle="Platform oversight — merchants, categories, store monitoring"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-sm text-muted-foreground mb-6">
            Platform owner view. You control who can sell and what goes online. You do not run POS or edit inventory directly; use Store Oversight for permanent delete only.
          </p>

          {isLoading ? (
            <p className="text-muted-foreground">Loading platform stats…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Store className="h-4 w-4" /> Merchants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats?.totalMerchants ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Active stores</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Online orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats?.totalOnlineOrders ?? 0}</p>
                  <p className="text-xs text-muted-foreground">E-commerce</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> POS orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats?.totalPosOrders ?? 0}</p>
                  <p className="text-xs text-muted-foreground">In-store</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" /> Super Admins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats?.totalSuperAdmins ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Platform admins</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Merchant requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.pendingMerchantRequests ?? 0} pending</p>
                <p className="text-xs text-muted-foreground">Approve or reject in Merchant Requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FolderClock className="h-4 w-4" /> Category requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.pendingCategoryRequests ?? 0} pending</p>
                <p className="text-xs text-muted-foreground">Approve for online in Category Requests</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
