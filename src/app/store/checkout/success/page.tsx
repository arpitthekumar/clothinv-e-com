"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useCart } from "@/components/store/cart-context";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    // ensure cart is cleared after a successful checkout (safety net)
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-semibold">Order placed successfully</h1>
      <p className="text-muted-foreground text-center">
        Thank you for your order. You can view your orders after logging in.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/store">Continue shopping</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth">Login / Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
