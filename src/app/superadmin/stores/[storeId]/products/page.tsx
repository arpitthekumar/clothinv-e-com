"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

export default function StoreProductsPage() {
  const params = useParams();
  const storeId = params?.storeId as string | undefined;

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return (await res.json()) as Array<any>;
    },
  });

  const filtered = (products ?? []).filter((p: any) => (p.storeId === storeId || p.store_id === storeId));

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`Store Products`} subtitle={`Store: ${storeId}`} onSidebarToggle={() => {}} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading ? (<p>Loading…</p>) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Name</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">{p.sku}</td>
                      <td className="p-2">{p.price}</td>
                      <td className="p-2">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
