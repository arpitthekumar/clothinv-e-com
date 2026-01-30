"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-background to-muted/30 px-6 py-16 md:px-12 md:py-24">
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          Welcome to ShopFlow
        </h1>
        <p className="mt-4 text-lg text-muted-foreground md:text-xl">
          Discover quality products at great prices. Browse by category and shop with confidence.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/store">
            <Button size="lg" className="text-base">
              Shop now
            </Button>
          </Link>
          <Link href="/store#categories">
            <Button size="lg" variant="outline" className="text-base">
              Browse categories
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
