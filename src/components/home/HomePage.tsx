"use client";

import { HomeNavbar } from "./HomeNavbar";
import { HomeHero } from "./HomeHero";
import { HomeProductGrid } from "./HomeProductGrid";
import { HomeFooter } from "./HomeFooter";

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavbar />
      <main className="container flex-1 px-4 py-8 space-y-10">
        <HomeHero />
        <HomeProductGrid />
      </main>
      <HomeFooter />
    </div>
  );
}
