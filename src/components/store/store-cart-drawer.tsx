"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "./cart-context";
import { ShoppingCart } from "lucide-react";

export function StoreCartDrawer() {
  const { items, totalItems, totalAmount, updateQuantity, removeItem } =
    useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // On the server (and first client render) we render a non-interactive placeholder
  // so SSR markup matches the initial client render and avoids Radix id mismatches.
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Cart ({totalItems} items)</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Cart is empty.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-2 border-b pb-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{parseFloat(item.price).toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <p className="font-semibold">Total: ₹{totalAmount}</p>
            <Button asChild className="w-full">
              <Link href="/store/checkout">Proceed to checkout</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
