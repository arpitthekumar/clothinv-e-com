"use client";

import Link from "next/link";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { HomeFooter } from "@/components/home/HomeFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavbar />
      <main className="container flex-1 px-4 py-12 max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of terms</h2>
            <p>
              By accessing and using ShopFlow, you accept and agree to be bound by these Terms of Service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">2. Use of the platform</h2>
            <p>
              You agree to use the platform only for lawful purposes and in accordance with these terms. You must not misuse the service or attempt to gain unauthorized access.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">3. Orders and payments</h2>
            <p>
              Orders placed through the platform are subject to availability. We reserve the right to refuse or cancel orders. Payment terms are as displayed at checkout.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">4. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us through the support channels listed on our website.
            </p>
          </section>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
