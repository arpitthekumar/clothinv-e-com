"use client";

import { Suspense } from "react";
import AuthPage from "@/components/pages/auth-page";

function AuthPageFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPage />
    </Suspense>
  );
}


