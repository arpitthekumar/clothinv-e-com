"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ShoppingCart } from "lucide-react";

export function HomeNavbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">ShopFlow</span>
        </Link>

        <div className="flex flex-1 items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
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
          {user ? (
            <>
              <span className="text-muted-foreground">Hello,</span>
              <span className="font-medium">{user.fullName || user.username}</span>
              <Link href="/store">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </Link>
              {user.role === "super_admin" && (
                <Link href="/superadmin">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/store">
                <Button size="sm">Shop</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
