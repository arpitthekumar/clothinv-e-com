"use client";

import { Navbar } from "@/components/ui/Navbar";
import Hero  from "./Hero";
import { HomeProductGrid } from "./HomeProductGrid";
import { HomeFooter } from "./HomeFooter";
import ProcessSection from "./ProcessSection";
import Cta from "./CtaSection";
import PromoBanner from "./PromoBanner";
import EcomPromoImage from "../../../public/home/promoimage.png";

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main >
          <Hero />
        <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-10">
          <HomeProductGrid />
          <div id="promo">
            <PromoBanner
              title="Get 10% Off on Your First Online Order"
              subtitle="Limited Time Offer"
              imageSrc={EcomPromoImage}
              imageAlt="E-commerce workspace with products and packaging"
              backgroundColor="bg-primary"
              textColor="text-primary-foreground"
              />
          </div>

              <ProcessSection/>
          <Cta/>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
