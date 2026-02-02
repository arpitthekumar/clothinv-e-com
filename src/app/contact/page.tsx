"use client";

import { Navbar } from "@/components/ui/Navbar";
import { HomeFooter } from "@/components/home/HomeFooter";
import Hero from "@/components/store/hero";
import Hero1 from "../../../public/hero/ecom-hero.png";
import Cta from "@/components/home/CtaSection";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <Hero
        backgroundImage={Hero1}
        altText="Contact Us"
        overlay={true}
        heightClass="h-[420px] md:h-[520px]"
      />

      {/* Content */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-20">
          {/* Header */}
          <div className="max-w-3xl mb-16">
            <h1 className="text-4xl font-bold tracking-tight">
              Contact Us
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Need help with an order, account, or becoming a seller?
              We’re here to help you every step of the way.
            </p>
          </div>

          {/* Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Support */}
            <div className="rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                Customer Support
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Order issues, returns, refunds, or account help.
              </p>
              <p className="text-sm text-muted-foreground">
                Sign in to your account and use the <span className="font-medium text-foreground">Help Center</span>
                for faster support.
              </p>
            </div>

            {/* Merchants */}
            <div className="rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                Merchants & Sellers
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Want to sell your products on our platform?
              </p>
              <p className="text-sm text-muted-foreground">
                Sign in and choose <span className="font-medium text-foreground">
                  “Become a Seller”</span> to get started.
              </p>
            </div>

            {/* Business */}
            <div className="rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                Business & Partnerships
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                For collaborations, integrations, or enterprise inquiries.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your assigned account manager or reach out through
                official business channels.
              </p>
            </div>
          </div>

          {/* Extra info */}
          <div className="mt-16 rounded-xl bg-muted p-8">
            <h2 className="text-2xl font-semibold mb-2">
              Fastest way to get help
            </h2>
            <p className="text-muted-foreground">
              Logged-in users get priority support.
              Please make sure you are signed in before contacting us.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-20">
            <Cta />
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
