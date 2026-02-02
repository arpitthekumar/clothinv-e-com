"use client";

import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { HomeFooter } from "@/components/home/HomeFooter";
import Hero from "@/components/store/hero";
import Hero1 from "../../../public/hero/ecom-hero.png";
import Cta from "@/components/home/CtaSection";
export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen justify-between">
      <Navbar />
        <Hero
          backgroundImage={Hero1}
          altText="Hero Banner"
          showHr={false}
          overlay={false} 
          heightClass="md:h-[700px] h-[500] "
        />    
      <main className="mx-auto w-full max-w-7xl px-4 py-20">
            <h1 className="text-3xl font-bold mb-6">Contact us</h1>
        <p className="text-muted-foreground mb-6">
          Have a question or need support? Reach out through the channels below.
        </p>
        <div className="space-y-4 rounded-lg border p-6">
          <p className="font-medium">Support</p>
          <p className="text-sm text-muted-foreground">
            For order and account support, please sign in and use the help section in your account, or contact your store administrator.
          </p>
          <p className="font-medium mt-4">Merchants</p>
          <p className="text-sm text-muted-foreground">
            To become a merchant on ShopFlow, use the &quot;Become a seller&quot; option after signing in.
          </p>
        </div>
        <Cta/>
      </main>
      <HomeFooter />
    </div>
  );
}
