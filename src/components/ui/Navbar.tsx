"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, Search, MapPin, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { StoreCartDrawer } from "@/components/store/store-cart-drawer";

export function Navbar() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [locationName, setLocationName] = useState<string | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<{ products: any[]; categories: any[] }>({ products: [], categories: [] });
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  const handleSearch = () => {
    const term = q.trim();
    if (term.length === 0) {
      router.push("/store");
    } else {
      router.push(`/store?q=${encodeURIComponent(term)}`);
    }
  };

  useEffect(() => {
    // load location from localStorage on mount
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_location");
      if (stored) setLocationName(stored);
    }
  }, []);

  useEffect(() => {
    // Close suggestions on outside click
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    // Debounced search for suggestions
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const term = q.trim();
    if (term.length < 2) {
      setSuggestions({ products: [], categories: [] });
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }
    setIsLoadingSuggestions(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/store/search?q=${encodeURIComponent(term)}&limit=6`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSuggestions({ products: data.products ?? [], categories: data.categories ?? [] });
        setShowSuggestions(true);
        setActiveIndex(null);
      } catch (err) {
        console.error("Autocomplete error:", err);
        setSuggestions({ products: [], categories: [] });
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-1 md:gap-7">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">ShopFlow</span>
        </Link>

        <div className="flex flex-1 items-center gap-2 max-w-xl">
          <div ref={wrapperRef} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (showSuggestions && activeIndex !== null) {
                    // pick active
                    const flat = [...suggestions.categories.map((c) => ({ type: "category", item: c })), ...suggestions.products.map((p) => ({ type: "product", item: p }))];
                    const sel = flat[activeIndex];
                    if (sel) {
                      if (sel.type === "product") router.push(`/store/product/${sel.item.slug}`);
                      else router.push(`/store/category/${sel.item.slug}`);
                      setShowSuggestions(false);
                      return;
                    }
                  }
                  handleSearch();
                } else if (e.key === "ArrowDown") {
                  const total = suggestions.categories.length + suggestions.products.length;
                  if (total === 0) return;
                  setShowSuggestions(true);
                  setActiveIndex((prev) => (prev === null ? 0 : Math.min(total - 1, prev + 1)));
                } else if (e.key === "ArrowUp") {
                  const total = suggestions.categories.length + suggestions.products.length;
                  if (total === 0) return;
                  setShowSuggestions(true);
                  setActiveIndex((prev) => (prev === null ? Math.max(0, total - 1) : Math.max(0, prev - 1)));
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                  setActiveIndex(null);
                }
              }}
              placeholder="Search products, categories..."
              className="pl-9 pr-9 bg-muted/50"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
            />
            <Button variant="ghost" size="icon" onClick={() => handleSearch()} className="absolute right-1 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4" />
            </Button>

            {/* Suggestions dropdown */}
            {showSuggestions && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
              <div role="listbox" aria-label="Search suggestions" className="absolute left-0 right-0 mt-2 z-50 rounded-md bg-popover shadow-lg border">
                <div className="p-2">
                  {suggestions.categories.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-muted-foreground px-2">Categories</div>
                      {suggestions.categories.map((c, idx) => {
                        const index = idx; // category indices start at 0
                        const isActive = activeIndex === index;
                        return (
                          <button
                            key={c.id}
                            onClick={() => { router.push(`/store/category/${c.slug}`); setShowSuggestions(false); setQ(c.name); }}
                            className={`w-full text-left px-3 py-2 rounded ${isActive ? "bg-muted" : "hover:bg-muted/50"}`}
                          >
                            <div className="font-medium">{c.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {suggestions.products.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground px-2">Products</div>
                      {suggestions.products.map((p, pIdx) => {
                        const index = suggestions.categories.length + pIdx; // products follow categories
                        const isActive = activeIndex === index;
                        return (
                          <button
                            key={p.id}
                            onClick={() => { router.push(`/store/product/${p.slug}`); setShowSuggestions(false); setQ(p.name); }}
                            className={`w-full text-left px-3 py-2 rounded ${isActive ? "bg-muted" : "hover:bg-muted/50"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.sku ? `SKU: ${p.sku}` : p.description ? p.description.slice(0, 60) : ""}</div>
                              </div>
                              <div className="text-sm font-medium">{p.price}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="border-t mt-2 pt-2 flex items-center justify-between px-2">
                    <button className="text-sm text-muted-foreground" onClick={() => { setShowSuggestions(false); setQ(""); }}>Clear</button>
                    <button className="text-sm text-primary" onClick={() => { router.push(`/store?q=${encodeURIComponent(q.trim())}`); setShowSuggestions(false); }}>{`View all results for "${q.trim()}"`}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => {
              const next = window.prompt("Set your location:", locationName || "") || "";
              if (next && typeof window !== "undefined") {
                localStorage.setItem("user_location", next);
                setLocationName(next);
              }
            }}
            className="hidden sm:inline-flex items-center gap-1 text-muted-foreground cursor-pointer"
            aria-label="Set location"
          >
            <MapPin className="h-4 w-4" />
            {locationName || "Location"}
          </button>

          <StoreCartDrawer />

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex text-muted-foreground">Hello,</span>
              <span className="font-medium hidden sm:inline-flex">{user.fullName || user.username}</span>
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/store">
                <Button size="sm">Shop</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
