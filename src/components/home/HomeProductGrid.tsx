"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function fetchJson(url: string) {
  return fetch(url).then((r) => (r.ok ? r.json() : []));
}

export function HomeProductGrid() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/store/products"],
    queryFn: () => fetchJson("/api/store/products"),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/store/categories"],
    queryFn: () => fetchJson("/api/store/categories"),
  });

  const byCategory = (categoryId: string | null) =>
    products.filter(
      (p: { categoryId?: string | null }) => (p.categoryId ?? null) === categoryId
    );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <CardContent className="p-3">
              <div className="h-4 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* All products */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Featured products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.slice(0, 10).map((p: { id: string; name: string; price: string; image?: string | null; slug?: string | null }) => (
            <Link key={p.id} href={`/store/product/${(p as any).slug ?? p.id}`}>
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {p.image ? (
                    <img
                      src={(() => {
                        try {
                          // lazy import helper to ensure env var usage
                          // eslint-disable-next-line @typescript-eslint/no-var-requires
                          const { getPublicImageUrl } = require("@/lib/media");
                          return getPublicImageUrl(p.image) || p.image;
                        } catch (e) {
                          return p.image;
                        }
                      })()}                      alt={p.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                  <p className="text-primary font-semibold mt-1">₹{p.price}</p>
                </CardContent>
              </Card>
            </Link>
          ))} 
        </div>
        {products.length > 10 && (
          <div className="mt-4 text-center">
            <Link href="/store">
              <Button variant="outline">View all products</Button>
            </Link>
          </div>
        )}
      </section>

      {/* By category */}
      {categories.length > 0 && (
        <section id="categories">
          <h2 className="text-xl font-semibold mb-4">Shop by category</h2>
          <div className="space-y-8">
            {categories.slice(0, 4).map((cat: { id: string; name: string }) => {
              const items = byCategory(cat.id);
              if (items.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h3 className="text-lg font-medium mb-3">{cat.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {items.slice(0, 4).map((p: { id: string; name: string; price: string; image?: string | null; slug?: string | null }) => (
                      <Link key={p.id} href={`/store/product/${(p as any).slug ?? p.id}`}>
                        <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-muted relative overflow-hidden">
                            {p.image ? (
                              <img
                                src={(() => {
                                  try {
                                    // lazy import helper to ensure env var usage
                                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                                    const { getPublicImageUrl } = require("@/lib/media");
                                    return getPublicImageUrl(p.image) || p.image;
                                  } catch (e) {
                                    return p.image;
                                  }
                                })()}                                alt={p.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No image
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                            <p className="text-primary font-semibold mt-1">₹{p.price}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))} 
                  </div>
                  <Link href={`/store/category/${(cat as any).slug ?? cat.id}`} className="inline-block mt-2">
                    <Button variant="ghost" size="sm">View all in {cat.name}</Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No products yet. Check back soon.</p>
      )}
    </div>
  );
}
