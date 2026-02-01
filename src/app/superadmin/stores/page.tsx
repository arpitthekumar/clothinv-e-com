"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Receipt } from "lucide-react";

export default function StoreOversightPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Store Oversight"
          subtitle="Read-only view with permanent delete (Super Admin only)"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-sm text-muted-foreground mb-6">
            View store data. You can permanently delete trashed products and sales only. You cannot add, edit, or create orders.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" /> Products
                </CardTitle>
                <CardDescription>
                  View all products. Move to trash then permanently delete if needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/inventory">
                  <Button>Open inventory (oversight)</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" /> Sales
                </CardTitle>
                <CardDescription>
                  View all sales (POS + online). Permanently delete trashed sales if needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/sales">
                  <Button>Open sales (oversight)</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
