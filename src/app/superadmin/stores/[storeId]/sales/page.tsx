"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

export default function StoreSalesPage() {
  const params = useParams();
  const storeId = params?.storeId as string | undefined;

  const { data: sales, isLoading } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: async () => {
      const res = await fetch("/api/sales");
      if (!res.ok) throw new Error("Failed to fetch sales");
      return (await res.json()) as Array<any>;
    },
  });

  const filtered = (sales ?? []).filter((s: any) => (s.storeId === storeId || s.store_id === storeId || s.store_id === storeId));

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`Store Sales`} subtitle={`Store: ${storeId}`} onSidebarToggle={() => {}} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading ? (<p>Loading…</p>) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Invoice</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{s.invoice_number}</td>
                      <td className="p-2">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="p-2">{s.total_amount}</td>
                      <td className="p-2">{s.order_source}</td>
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
