"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

function getQueryFn(url: string) {
  return async () => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };
}

export default function StoreOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: getQueryFn("/api/orders"),
    enabled: !!user,
  });

  // Avoid calling router.replace during render — do it in an effect.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth?returnUrl=" + encodeURIComponent("/store/orders"));
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // For customer, API returns sales where customer_id = user.id (online orders)
  const list = Array.isArray(orders) ? orders : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-6">My orders</h1>
        {ordersLoading ? (
          <p className="text-muted-foreground">Loading orders…</p>
        ) : list.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>You haven’t placed any orders yet.</p>
              <Link href="/store">
                <Button className="mt-4">Browse store</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {list.map((order: {
              id: string;
              invoice_number?: string;
              total_amount?: string;
              created_at?: string;
              order_source?: string;
            }) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Order {order.invoice_number ?? order.id}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                    {order.order_source === "online" && " · Online"}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    Total: ₹{order.total_amount ?? "0.00"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
