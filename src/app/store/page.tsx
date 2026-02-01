"use client";

import { CartProvider } from "@/components/store/cart-context";
import StorePage from "@/components/store/store-page";

export default function StoreRoute() {
  return (
    <CartProvider>
      <StorePage />
    </CartProvider>
  );
}
