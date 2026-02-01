"use client";

import { CartProvider } from "@/components/store/cart-context";
import { CheckoutPage } from "@/components/store/checkout-page";

export default function CheckoutRoute() {
  return (
    <CartProvider>
      <CheckoutPage />
    </CartProvider>
  );
}
