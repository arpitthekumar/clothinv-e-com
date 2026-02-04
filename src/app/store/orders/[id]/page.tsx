"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

function getQueryFn(url: string) {
  return async () => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const { data: order, isLoading: loading, refetch } = useQuery({
    queryKey: ["/api/orders", id],
    queryFn: getQueryFn(`/api/orders/${id}`),
    enabled: !!id && !!user,
    refetchInterval: false,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <main className="container max-w-2xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading order…</p>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Order not found.</p>
              <Link href="/store/orders">
                <Button className="mt-4">Back to orders</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items ?? "[]");
  const trackingUrl = (order as any).tracking_url;
  const estimated = (order as any).estimated_delivery;

  return (
    <div className=" bg-background">
      <main className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Order {order.invoice_number ?? order.id}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => refetch()}>Refresh status</Button>
            <Link href="/store/orders">
              <Button variant="ghost">Back</Button>
            </Link>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">Order status</CardTitle>
                  <Badge
                    variant={(() => {
                      const s = (order.status || "").toString().toLowerCase();
                      if (s === "cancelled" || s === "canceled") return "destructive";
                      if (s === "delivered" || s === "completed") return "default";
                      if (s === "shipped" || s === "dispatched") return "outline";
                      return "secondary";
                    })()}
                    className="uppercase tracking-wide text-xs py-1 px-2"
                  >
                    {((str: any) => String(str ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()))(order.status)}
                  </Badge>
                </div>

                <div className="mt-3">
                  <Progress
                    value={(() => {
                      const s = (order.status || "").toString().toLowerCase();
                      switch (s) {
                        case "pending":
                        case "placed":
                          return 15;
                        case "processing":
                        case "confirmed":
                          return 45;
                        case "shipped":
                        case "dispatched":
                          return 75;
                        case "delivered":
                        case "completed":
                          return 100;
                        case "cancelled":
                        case "canceled":
                          return 0;
                        default:
                          return 30;
                      }
                    })()}
                    className="h-2 rounded-full"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Placed</span>
                    <span>Processing</span>
                    <span>Shipped</span>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                {trackingUrl ? (
                  <>
                    <a href={trackingUrl} target="_blank" rel="noreferrer">
                      <Button size="sm">Track shipment</Button>
                    </a>
                    <Button variant="outline" size="sm" onClick={() => window.open(trackingUrl, "_blank")}>Open tracking</Button>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Tracking information is not available yet.</div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mt-4 mb-2 text-sm text-muted-foreground">Placed: {order.created_at ? new Date(order.created_at).toLocaleString() : ""}</p>
            <p className="mb-4 text-lg font-semibold">Total: ₹{order.total_amount ?? "0.00"}</p>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Items</h3>
              <ul className="space-y-2">
                {items.map((it: any) => (
                  <li key={it.productId} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-muted-foreground">Qty: {it.quantity}</div>
                    </div>
                    <div className="text-sm">₹{it.price}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* {trackingUrl ? (
              <div className="flex items-center space-x-2">
                <a href={trackingUrl} target="_blank" rel="noreferrer">
                  <Button>Track shipment</Button>
                </a>
                <Button variant="outline" onClick={() => window.open(trackingUrl, "_blank")}>Open tracking</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tracking information is not available yet. We'll update you when the order is shipped.</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Link href={`/store/${order.storeId}`}>
                    <Button size="sm">Contact seller</Button>
                  </Link>
                </div>
              </div>
            )} */}

            {estimated ? (
              <p className="mt-4 text-sm">Estimated delivery: {estimated}</p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
