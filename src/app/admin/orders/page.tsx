"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/header";
import { Sidebar } from "@/components/shared/sidebar";
import { useEffect, useState } from "react";
import DateRangePicker from "@/components/reports/DateRangePicker";
import OrdersSearchBar from "@/components/orders/OrdersSearchBar";
import OrdersList from "@/components/orders/OrdersList";
import { useOrders } from "@/components/orders/useOrders";

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
    const [limit, setLimit] = useState<number>(20);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [excludeDelivered, setExcludeDelivered] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchBy, setSearchBy] = useState("all");

    // date handling
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [dateRange, setDateRange] = useState("");

    // Use new hook to load orders
    const { ordersQuery, updateStatus } = useOrders({
        limit,
        excludeDelivered,
        search: searchTerm,
        searchBy,
        status: statusFilter || undefined,
        start: startDate || undefined,
        end: endDate || undefined,
    });

    // refresh helper
    function refetch(reset: boolean = false) {
        if (reset) {
            // reset sales query
            // we can invalidate the query and allow useOrders to refetch
            // queryClient.removeQueries({ queryKey: ["/api/orders/load"] });
        }
        ordersQuery.refetch();
    }

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

                    {/* Filters */}

                    <OrdersSearchBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        searchBy={searchBy}
                        setSearchBy={setSearchBy}
                        limit={limit}
                        setLimit={setLimit}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        onOpenDatePicker={() => setDatePickerOpen(true)}
                        refresh={() => refetch(true)}
                        excludeDelivered={excludeDelivered}
                        setExcludeDelivered={setExcludeDelivered}
                    />

                    <DateRangePicker
                        open={datePickerOpen}
                        onOpenChange={setDatePickerOpen}
                        currentRange={{
                            from: startDate ? new Date(startDate) : undefined,
                            to: endDate ? new Date(endDate) : undefined,
                        }}
                        onDateRangeChange={(range: { from?: Date; to?: Date } | null) => {
                            if (!range) {
                                setStartDate("");
                                setEndDate("");
                            } else {
                                setStartDate(range.from?.toISOString() || "");
                                setEndDate(range.to?.toISOString() || "");
                            }
                            refetch(true);
                        }}
                    />

                    <OrdersList
                        isLoading={ordersQuery.isLoading}
                        ordersQuery={ordersQuery}
                        onUpdateStatus={(payload: any) => updateStatus.mutate(payload)}
                    />

                    {/* Infinite loader handled by OrdersList buttons / fetchNextPage */}
                </main>
            </div>
        </div>
    );
}
