"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { EditCategoryModal } from "@/components/shared/edit-category-modal";

export default function LiveCategoriesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return (await res.json()) as Array<any>;
    },
  });

  const online = (categories ?? []).filter(
    (c: any) => (c.visibility === "online" || c.visibility === "ONLINE") && ((c.approvalStatus ?? c.approval_status) === "approved")
  );

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Live Categories" subtitle="Edit categories currently online" onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-sm text-muted-foreground mb-4">Only categories that are published online are shown here for quick updates.</p>

          {isLoading ? (
            <p className="text-muted-foreground">Loading categories…</p>
          ) : online.length === 0 ? (
            <p className="text-muted-foreground">No online categories found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {online.map((c: any) => (
                <div key={c.id} className="border rounded p-4">
                  <h3 className="font-semibold mb-2">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{c.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditing(c)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <EditCategoryModal open={!!editing} onClose={() => setEditing(null)} category={editing} />
        </main>
      </div>
    </div>
  );
}
