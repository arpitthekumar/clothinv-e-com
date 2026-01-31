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

      const created = await res.json();
      const orderId = created.id;

      // Create server-side Razorpay order
      const r = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create payment order");
      }
      const { razorpayOrder, keyId } = await r.json();

      // Load Razorpay checkout script if needed
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load razorpay script"));
          document.head.appendChild(s);
        });
      }

      // Open Razorpay inline checkout
      await new Promise<void>((resolve, reject) => {
        const options: any = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "ClothInv Store",
          description: `Order ${created.invoice_number || created.id}`,
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            try {
              // Verify payment server-side
              const vr = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId,
                }),
              });
              if (!vr.ok) {
                const err = await vr.json().catch(() => ({}));
                reject(new Error(err.error || "Payment verification failed"));
                return;
              }

              resolve();
            } catch (err) {
              reject(err);
            }
          },
          prefill: {
            name: window?.localStorage?.getItem("user_name") || undefined,
          },
          theme: { color: "#2563eb" },
        };
        const rp = new (window as any).Razorpay(options);
        rp.open();
      });

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
