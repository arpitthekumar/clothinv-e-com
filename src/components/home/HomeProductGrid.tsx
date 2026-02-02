"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tailwindBorderMap, tailwindColorMap } from "@/lib/colors";
import { useCart } from "../store/cart-context";

// 🔹 TYPES
type Category = {
  id: string;
  name: string;
  slug?: string | null;
  color?: string | null;
};

type Product = {
  id: string;
  name: string;
  price: string;
  image?: string | null;
  slug?: string | null;
  categoryId?: string | null;
};

// 🔹 FETCHER
function fetchJson(url: string) {
  return fetch(url).then((r) => (r.ok ? r.json() : []));
}

export function HomeProductGrid() {
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 🔹 QUERIES
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/store/products"],
    queryFn: () => fetchJson("/api/store/products"),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/store/categories"],
    queryFn: () => fetchJson("/api/store/categories"),
  });

  // 🔹 HELPERS
  const byCategory = (categoryId: string | null) =>
    products.filter(
      (p) => (p.categoryId ?? null) === categoryId
    );

  const scroll = (id: string, dir: "left" | "right") => {
    const el = scrollRefs.current[id];
    if (!el) return;

    el.scrollBy({
      left: dir === "left" ? -600 : 600, // 🔥 bigger jump
      behavior: "smooth",
    });
  };

  const { addItem } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  // 🔹 LOADING STATE
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
    <div className="space-y-12">
      {/* ================= FEATURED ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Featured products</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 rounded-4xl bg-amber-200 p-6">
          {products.slice(0, 10).map((p) => (
            <Link key={p.id} href={`/store/product/${p.slug ?? p.id}`}>
              <Card className="overflow-hidden h-full hover:shadow-md transition">
                <div className="aspect-square bg-muted overflow-hidden">
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
                      })()}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>

                <CardContent className="p-3">
                  <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                  <p className="font-semibold mt-1">₹{p.price}</p>

                  <Button
                  size="sm"
                  className="mt-2 w-full"
                  disabled={addingId === p.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setAddingId(p.id);
                    try {
                      addItem({
                        productId: p.id,
                        name: p.name,
                        sku: p.id,
                        price: p.price,
                        quantity: 1,
                      });
                    } finally {
                      setAddingId(null);
                    }
                  }}
                              >
                  {addingId === p.id ? "Adding..." : "Add to cart"}
                </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= BY CATEGORY ================= */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Shop by category</h2>

          <div className="space-y-10">
            {categories.slice(0, 4).map((cat) => {
              const items = byCategory(cat.id);
              if (items.length === 0) return null;

              const colorKey = cat.color ?? "white";

              return (
                <div
                  key={cat.id}
                  className={`rounded-4xl p-5 ${tailwindColorMap[colorKey]?.bg ?? ""
                    } ${tailwindBorderMap[colorKey] ?? ""}`}
                >
                  <h3
                    className={`text-lg font-semibold mb-3 ${tailwindColorMap[colorKey]?.text ?? "text-black"
                      }`}
                  >
                    {cat.name}
                  </h3>

                  <div className="relative text-black">
                    {/* LEFT */}
                    <button
                      type="button"
                      onClick={() => scroll(cat.id, "left")}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border rounded-full p-2 shadow cursor-pointer"
                    >
                      ←
                    </button>

                    <button
                      type="button"
                      onClick={() => scroll(cat.id, "right")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border rounded-full p-2 shadow cursor-pointer"
                    >
                      →
                    </button>


                    {/* CAROUSEL */}
                    <div
                      ref={(el) => {
                        scrollRefs.current[cat.id] = el;
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight") scroll(cat.id, "right");
                        if (e.key === "ArrowLeft") scroll(cat.id, "left");
                      }}
                      className="flex gap-4 overflow-x-auto  scroll-smooth  no-scrollbar px-10"
                    >
                      {items.map((p) => (
                        <Link
                          key={p.id}
                          href={`/store/product/${p.slug ?? p.id}`}
                          className="min-w-[180px] "
                        >
                          <Card className="hover:shadow-md  transition">
                            <div className="aspect-square bg-muted rounded-3xl  overflow-hidden">
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
                                  })()} alt={p.name}
                                  className="w-full h-full "
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                  No image
                                </div>
                              )}
                            </div>

                            <CardContent className="p-3">
                              <p className="text-sm font-medium line-clamp-2">
                                {p.name}
                              </p>
                              <p className="font-semibold mt-1">₹{p.price}</p>

                              <Button
                                size="sm"
                                className="mt-2 w-full"
                                disabled={addingId === p.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setAddingId(p.id);
                                  try {
                                    addItem({
                                      productId: p.id,
                                      name: p.name,
                                      sku: p.id,
                                      price: p.price,
                                      quantity: 1,
                                    });
                                  } finally {
                                    setAddingId(null);
                                  }
                                }}
                              >
                                {addingId === p.id ? "Adding..." : "Add to cart"}
                              </Button>

                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/store/category/${cat.slug ?? cat.id}`}
                    className="inline-block mt-3"
                  >
                    <Button variant="ghost" size="sm">
                      <h3
                        className={` ${tailwindColorMap[colorKey]?.text ?? "text-black"
                          }`}
                      >
                        View all in {cat.name}
                      </h3>
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
