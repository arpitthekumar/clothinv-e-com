"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-context";
import { useAuth } from "@/hooks/use-auth";

export function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const returnUrl = encodeURIComponent("/store/checkout");
      router.replace(`/auth?returnUrl=${returnUrl}`);
    }
  }, [user, isLoading, router]);

  const placeOrder = async () => {
    if (items.length === 0) {
      setError("Cart is empty.");
      return;
    }
    setError(null);
    setPlacing(true);
    try {
      const orderItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        name: i.name,
        sku: i.sku,
      }));
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          customer_name: user?.fullName || user?.username,
          customer_phone: "N/A",
          payment_method: "online",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Order failed");
      }
      clearCart();
      router.push("/store/checkout/success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center px-4">
          <Link href="/store" className="font-semibold">
            Store
          </Link>
        </div>
      </header>
      <main className="container max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">Checkout</h1>
        {items.length === 0 ? (
          <p className="text-muted-foreground mb-4">
            Your cart is empty. <Link href="/store" className="text-primary underline">Continue shopping</Link>.
          </p>
        ) : (
          <>
            <ul className="space-y-2 mb-6">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-semibold mb-4">Total: ₹{totalAmount}</p>
            {error && (
              <p className="text-destructive text-sm mb-4">{error}</p>
            )}
            <Button
              className="w-full"
              disabled={placing}
              onClick={placeOrder}
            >
              {placing ? "Placing order…" : "Place order"}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
