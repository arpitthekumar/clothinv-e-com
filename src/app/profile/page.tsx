"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/ui/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { user, isLoading, logoutMutation } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("account");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth");
    }
  }, [isLoading, user, router]);

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!user,
  });

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="flex gap-2">
            <Link href="/store/become-merchant">
              <Button variant="outline">Become merchant</Button>
            </Link>
            <Link href="/store/orders">
              <Button>My store orders</Button>
            </Link>
          </div>
        </div>

        <div className="flex gap-4">
          <nav className="w-48">
            <ul className="space-y-2">
              <li>
                <button className={`w-full text-left p-2 rounded ${tab === "account" ? "bg-muted" : ""}`} onClick={() => setTab("account")}>
                  Account
                </button>
              </li>
              <li>
                <button className={`w-full text-left p-2 rounded ${tab === "orders" ? "bg-muted" : ""}`} onClick={() => setTab("orders")}>Orders</button>
              </li>
            </ul>
          </nav>

          <section className="flex-1">
            {tab === "account" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Name:</strong> {user?.fullName ?? user?.username}</p>
                  <p><strong>Role:</strong> {user?.role}</p>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" onClick={() => logoutMutation.mutate()}>
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <p className="text-muted-foreground">Loading orders…</p>
                  ) : orders.length === 0 ? (
                    <p className="text-muted-foreground">No orders found.</p>
                  ) : (
                    <ul className="space-y-3">
                      {orders.map((o: any) => (
                        <div key={o.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Order {o.invoice_number ?? o.id}</div>
                              <div className="text-sm text-muted-foreground">{o.created_at}</div>
                            </div>
                            <div className="font-medium">₹{o.total_amount}</div>
                          </div>
                        </div>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
