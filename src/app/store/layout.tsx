"use client";

import React from "react";
import { CartProvider } from "@/components/store/cart-context";
import { Navbar } from "@/components/ui/Navbar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}
