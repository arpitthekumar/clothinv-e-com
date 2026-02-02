"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function BecomeMerchantPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");

  // Require auth; redirect to login with returnUrl
  if (!isLoading && !user) {
    router.replace("/auth?returnUrl=" + encodeURIComponent("/store/become-merchant"));
    return null;
  }

  // Already merchant/admin/super_admin — no need to apply
  if (user && ["admin", "super_admin"].includes(user.role)) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast({ title: "Shop name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/merchant-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shopName: shopName.trim(),
          address: address.trim() || undefined,
          businessDetails: businessDetails.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }
      toast({ title: "Application submitted", description: "A Super Admin will review your request." });
      router.push("/store");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Apply to become a merchant</CardTitle>
            <CardDescription>
              Submit your shop details. A Super Admin will review and approve or reject your request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Shop name *</label>
                <Input
                  className="mt-1"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Your shop name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address (optional)</label>
                <Input
                  className="mt-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Business address"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Business details (optional)</label>
                <Textarea
                  className="mt-1"
                  value={businessDetails}
                  onChange={(e) => setBusinessDetails(e.target.value)}
                  placeholder="Brief description of your business"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit application"}
                </Button>
                <Link href="/store">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
