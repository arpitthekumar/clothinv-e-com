"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, Search, MapPin, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<Array<any>>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/store/categories");
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setCategories(json);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-1 md:gap-7">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">ShopFlow</span>
        </Link>

        <div className="flex items-center gap-2">
          {open && categories.length > 0 && (
            <div className="absolute mt-12 bg-background border rounded shadow w-64 p-3">
              <ul className="space-y-1">
                {categories.map((c: any) => (
                  <li key={c.id}>
                    <Link href={`/store/category/${c.slug ?? c.id}`} className="block px-2 py-1 hover:bg-muted rounded">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Location
          </span>

          <Link href="/store">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </Link>

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
