"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

function getQueryFn(url: string) {
  return async () => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };
}

export default function MerchantRequestsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/merchant-requests"],
    queryFn: getQueryFn("/api/merchant-requests"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/merchant-requests/${id}`, { status: "approved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant-requests"] });
      toast({ title: "Merchant request approved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/merchant-requests/${id}`, { status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant-requests"] });
      toast({ title: "Merchant request rejected" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pending = requests.filter((r: { status: string }) => r.status === "pending");

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Merchant Requests"
          subtitle="Approve or reject applications to become merchants"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending requests ({pending.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : pending.length === 0 ? (
                <p className="text-muted-foreground">No pending merchant requests.</p>
              ) : (
                <ul className="space-y-4">
                  {pending.map((r: { id: string; shop_name: string; address?: string; business_details?: string; user_id: string; created_at?: string }) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
                    >
                      <div>
                        <p className="font-medium">{r.shop_name}</p>
                        {r.address && <p className="text-sm text-muted-foreground">{r.address}</p>}
                        {r.business_details && (
                          <p className="text-sm text-muted-foreground mt-1">{r.business_details}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">User ID: {r.user_id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(r.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
