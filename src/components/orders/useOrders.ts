"use client";

import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useOrders(
  filters: {
    limit?: number;
    excludeDelivered?: boolean;
    search?: string;
    searchBy?: string;
    status?: string;
    start?: string;
    end?: string;
  } = {}
) {
  const { toast } = useToast();

  const ordersQuery = useInfiniteQuery({
    queryKey: ["/api/orders/load", {
      limit: filters.limit ?? 20,
      excludeDelivered: filters.excludeDelivered ?? true,
      status: filters.status || undefined,
      start: filters.start || undefined,
      end: filters.end || undefined,
    }],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const qp = new URLSearchParams();
      qp.set("limit", String(filters.limit ?? 20));
      if (pageParam) qp.set("cursor", String(pageParam));
      if (filters.search) qp.set("search", filters.search);
      if (filters.searchBy) qp.set("searchBy", filters.searchBy);
      if (filters.status) qp.set("status", String(filters.status));
      if (filters.start) qp.set("start", String(filters.start));
      if (filters.end) qp.set("end", String(filters.end));
      if (filters.excludeDelivered !== undefined) qp.set("excludeDelivered", String(filters.excludeDelivered));

      const res = await fetch(`/api/orders/load?${qp.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return await res.json(); // { data, nextCursor }
    },
    getNextPageParam: (lastPage: any) => lastPage?.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const updateStatus = useMutation({
    mutationFn: (body: any) => apiRequest("PATCH", `/api/orders/${body.id}/status`, body).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/load"] });
      toast({ title: "Order updated" });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  return { ordersQuery, updateStatus };
}
