"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StoreProductCard } from "./store-product-card";
import { StoreCartDrawer } from "./store-cart-drawer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { HomeFooter } from "../home/HomeFooter";

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
    <div className="min-h-screen bg-background flex flex-col justify-between">

      <main className="container px-4 py-6">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 items-center">
            <Link href="/store">
              <Button variant={categoryFilter === null ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter(null)}>
                All
              </Button>
            </Link>
            {categories.map((c: { id: string; name: string; slug?: string }) => (
              <Link key={c.id} href={`/store/category/${c.slug ?? c.id}`}>
                <Button
                  variant={categoryFilter === c.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(c.id)}
                >
                  {c.name}
                </Button>
              </Link>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <Input placeholder="Min price" className="w-28" onChange={(e) => {/* no-op; filtering supported in category page */}} />
              <Input placeholder="Max price" className="w-28" onChange={(e) => {/* no-op; filtering supported in category page */}} />
              <Button variant="outline" size="sm">Filter</Button>
            </div>
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
