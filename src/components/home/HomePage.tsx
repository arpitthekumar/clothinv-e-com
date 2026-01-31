"use client";

import { Navbar } from "@/components/ui/Navbar";
import { HomeHero } from "./HomeHero";
import { HomeProductGrid } from "./HomeProductGrid";
import { HomeFooter } from "./HomeFooter";
import ProcessSection from "./ProcessSection";

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-10">
          <HomeHero />
          <HomeProductGrid />
          <ProcessSection/>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
