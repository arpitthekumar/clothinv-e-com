"use client";

import { Navbar } from "@/components/ui/Navbar";
import Hero  from "./Hero";
import { HomeProductGrid } from "./HomeProductGrid";
import { HomeFooter } from "./HomeFooter";
import ProcessSection from "./ProcessSection";
import Cta from "./CtaSection";


export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main >
          <Hero />
        <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-10">
          <HomeProductGrid />
          <ProcessSection/>
          <Cta/>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
