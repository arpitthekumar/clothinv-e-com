"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StoreProductCard } from "./store-product-card";
import { StoreCartDrawer } from "./store-cart-drawer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

function getQueryFn(url: string) {
  return async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };
}

export default function StorePage() {
  const { user } = useAuth();
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/store/products"],
    queryFn: getQueryFn("/api/store/products"),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/store/categories"],
    queryFn: getQueryFn("/api/store/categories"),
  });
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered =
    categoryFilter == null
      ? products
      : products.filter(
          (p: { categoryId?: string | null }) => p.categoryId === categoryFilter
        );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/store" className="font-semibold">
            Store
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/store/orders">
                  <Button variant="ghost" size="sm">My orders</Button>
                </Link>
                {user.role !== "admin" && user.role !== "super_admin" && (
                  <Link href="/store/become-merchant">
                    <Button variant="outline" size="sm">Become a seller</Button>
                  </Link>
                )}
                <StoreCartDrawer />
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <StoreCartDrawer />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={categoryFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(null)}
            >
              All
            </Button>
            {categories.map((c: { id: string; name: string }) => (
              <Button
                key={c.id}
                variant={categoryFilter === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(c.id)}
              >
                {c.name}
              </Button>
            ))}
          </div>
        )}

        {productsLoading ? (
          <p className="text-muted-foreground">Loading products…</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No products to show.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product: { id: string; name: string; sku: string; price: string; stock: number; description?: string | null }) => (
              <StoreProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
