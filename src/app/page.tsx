"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { HomePage } from "@/components/home/HomePage";

export default function Page() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "super_admin") {
      router.replace("/superadmin");
      return;
    }
    if (user?.role === "admin" || user?.role === "employee") {
      router.replace("/admin");
      return;
    }
  }, [user?.role, isLoading, router]);

  if (!isLoading && (user?.role === "super_admin" || user?.role === "admin" || user?.role === "employee")) {
    return null;
  }

  return <HomePage />;
}
