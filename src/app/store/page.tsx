import React, { Suspense } from "react";
import StorePage from "@/components/store/store-page";

export default function StoreRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>}>
      <StorePage />
    </Suspense>
  );
}
