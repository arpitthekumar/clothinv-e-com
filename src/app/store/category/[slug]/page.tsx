"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StoreProductCard } from "@/components/store/store-product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CategoryPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [min, setMin] = useState<string>("");
  const [max, setMax] = useState<string>("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/store/products", slug, min, max],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (slug) q.set("categorySlug", slug);
      if (min) q.set("minPrice", min);
      if (max) q.set("maxPrice", max);
      const res = await fetch(`/api/store/products?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-xl font-semibold">Category: {slug}</h1><Button onClick={() => window.history.back()}>←</Button>
          <div className="ml-auto flex items-center gap-2">
            <Input className="w-28" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} />
            <Input className="w-28" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} />
            <Button onClick={() => {/* refetch handled by queryKey */}}>Apply</Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">No products.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <StoreProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
