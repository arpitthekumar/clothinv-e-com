"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { Package, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StoreOversightPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const storesQuery = useQuery({
    queryKey: ["/api/superadmin/stores"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/stores");
      if (!res.ok) throw new Error("Failed to fetch stores");
      return (await res.json()) as Array<{ id: string; name: string }>;
    },
  });

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Store Oversight"
          subtitle="Choose a store to view products or sales"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-sm text-muted-foreground mb-4">Select a store and then choose which dataset to view.</p>

          {storesQuery.isLoading ? (
            <p className="text-muted-foreground">Loading stores…</p>
          ) : !Array.isArray(storesQuery.data) || storesQuery.data.length === 0 ? (
            <p className="text-muted-foreground">No stores found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {storesQuery.data.map((s) => (
                <div key={s.id} className="border rounded p-4">
                  <h3 className="font-semibold mb-2">{s.name}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => router.push(`/superadmin/stores/${s.id}/products`)}>Products</Button>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/superadmin/stores/${s.id}/sales`)}>Sales</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
