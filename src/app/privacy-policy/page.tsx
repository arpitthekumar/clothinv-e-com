"use client";

import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { HomeFooter } from "@/components/home/HomeFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">1. Information we collect</h2>
            <p>
              We collect information you provide when you register, place orders, or contact us. This may include your name, email, phone, and address.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">2. How we use your information</h2>
            <p>
              We use your information to process orders, improve our services, and communicate with you about your account and orders.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">3. Data security</h2>
            <p>
              We take reasonable measures to protect your personal information from unauthorized access, alteration, or disclosure.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">4. Contact</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us through the support channels listed on our website.
            </p>
          </section>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
