"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Purchasing (suppliers / purchase orders) has been removed.
 * Redirect to dashboard.
 */
export default function PurchasingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
