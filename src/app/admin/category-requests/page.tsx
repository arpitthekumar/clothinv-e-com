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

export default function CategoryRequestsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn("/api/categories"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/categories/${id}/approval`, {
        approvalStatus: "approved",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category approved for online" });
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/categories/${id}/approval`, {
        approvalStatus: "rejected",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category request rejected" });
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pending = categories.filter(
    (c: { approval_status?: string; approvalStatus?: string }) =>
      (c.approval_status ?? c.approvalStatus) === "pending"
  );

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Category Requests"
          subtitle="Approve or reject categories for online visibility"
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending category requests ({pending.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : pending.length === 0 ? (
                <p className="text-muted-foreground">
                  No categories pending approval for online.
                </p>
              ) : (
                <ul className="space-y-4">
                  {pending.map(
                    (c: {
                      id: string;
                      name: string;
                      description?: string;
                      visibility?: string;
                    }) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
                      >
                        <div>
                          <p className="font-medium">{c.name}</p>
                          {c.description && (
                            <p className="text-sm text-muted-foreground">
                              {c.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(c.id)}
                            disabled={
                              approveMutation.isPending || rejectMutation.isPending
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(c.id)}
                            disabled={
                              approveMutation.isPending || rejectMutation.isPending
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
