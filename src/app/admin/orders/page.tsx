"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/header";
import { Sidebar } from "@/components/shared/sidebar";
import { useEffect, useState } from "react";

function getQueryFn(url: string) {
    return async () => {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    };
}

export default function AdminOrdersPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    useEffect(() => {
        const isMobile = window.innerWidth < 768; // md breakpoint
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, []);
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };
    const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
        queryKey: ["/api/orders", { adminView: true }],
        queryFn: getQueryFn("/api/orders"),
        enabled: !!user,
    });

    const patchMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await fetch(`/api/orders/${id}/status`, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Order updated" });
            refetch();
        },
        onError: (e: any) => {
            toast({ title: "Failed to update order", variant: "destructive" });
        },
    });

    if (!isLoading && !user) {
        router.replace("/auth?returnUrl=" + encodeURIComponent("/admin/orders"));
        return null;
    }

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading…</p>
            </div>
        );
    }

    const list = Array.isArray(orders) ? orders : [];

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar isOpen={sidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="order Management"
                    subtitle="All orders placed online in the system"
                    onSidebarToggle={toggleSidebar}
                />
                <main className="container max-w-4xl mx-auto px-4 py-8">
                    <h1 className="text-xl font-semibold mb-6">Orders</h1>

                    {ordersLoading ? (
                        <p className="text-muted-foreground">Loading orders…</p>
                    ) : list.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                <p>No orders found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <ul className="space-y-4">
                            {list.map((order: any) => (
                                <Card key={order.id}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Order {order.invoice_number ?? order.id}</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {order.created_at
                                                ? new Date(order.created_at).toLocaleString()
                                                : ""}
                                            {order.order_source === "online" && " · Online"}
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="font-medium">Total: ₹{order.total_amount ?? "0.00"}</p>

                                        <div className="mt-3 flex gap-2">
                                            <div className="grow">
                                                <p className="text-sm">Status: <strong>{order.status}</strong></p>
                                            </div>
                                            <div className="flex gap-2">
                                                {order.status === "created" && (
                                                    <>
                                                        <Button onClick={() => patchMutation.mutate({ id: order.id, status: "packed" })}>Mark Packed</Button>
                                                        <Button variant="destructive" onClick={() => patchMutation.mutate({ id: order.id, status: "cancelled" })}>Cancel</Button>
                                                    </>
                                                )}

                                                {order.status === "packed" && (
                                                    <>
                                                        <Button onClick={() => patchMutation.mutate({ id: order.id, status: "shipped" })}>Mark Shipped</Button>
                                                        <Button variant="destructive" onClick={() => patchMutation.mutate({ id: order.id, status: "cancelled" })}>Cancel</Button>
                                                    </>
                                                )}

                                                {order.status === "shipped" && (
                                                    <>
                                                        <Button onClick={() => patchMutation.mutate({ id: order.id, status: "delivered" })}>Mark Delivered</Button>
                                                        <Button variant="destructive" onClick={() => patchMutation.mutate({ id: order.id, status: "cancelled" })}>Cancel</Button>
                                                    </>
                                                )}

                                                {order.status === "cancelled" && (
                                                    <p className="text-sm text-muted-foreground">Cancelled</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </ul>
                    )}
                </main>
            </div>
        </div>
    );
}
