"use client";

import React from "react";
import { CartProvider } from "@/components/store/cart-context";
import { Navbar } from "@/components/ui/Navbar";
import { HomeFooter } from "@/components/home/HomeFooter";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
          <Navbar />

      {children}
      <HomeFooter/>
    </CartProvider>
  );
}
