import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";
import { Store, Shield, Users, BarChart3 } from "lucide-react";
import { z } from "zod";
import Link from "next/link";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "";
  const { user, loginMutation } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    // Honor returnUrl when appropriate for role: store routes for customers, admin routes for admins
    if (returnUrl) {
      if (returnUrl.startsWith("/store") && user.role === "customer") {
        router.replace(returnUrl);
        return;
      }
      if (returnUrl.startsWith("/admin") && (user.role === "admin" || user.role === "super_admin")) {
        router.replace(returnUrl);
        return;
      }
    }

    if (user.role === "super_admin" || user.role === "admin") {
      router.replace("/superadmin");
      return;
    }

    if (user.role === "customer") {
      router.replace("/store");
      return;
    }

    router.replace("/pos");
  }, [user, returnUrl, router]);

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="text-primary-foreground text-2xl" />
            </div>
            <h1 className="text-3xl font-bold">ShopFlow</h1>
            <p className="text-muted-foreground">Inventory Management System</p>
          </div>

          {/* Sign In only - self registration removed */}

          {/* Login Form */}
          {true ? (
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your username"
                              {...field}
                              data-testid="input-login-username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                              data-testid="input-login-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
                <div className="flex items-center justify-between mt-2">
                  <Link href="/register" className="text-sm text-primary hover:underline">
                    Don't have an account? Register
                  </Link>
                  <Link href="/" className="text-sm text-primary hover:underline  block">
                    Continue to Store
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 bg-primary text-primary-foreground p-8 items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold mb-6">Modern Inventory Management</h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            Streamline your clothing shop operations with offline-first inventory tracking,
            fast billing, and powerful analytics.
          </p>

          <div className="space-y-4">
            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mr-4">
                <Shield className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Role-Based Access</h3>
                <p className="text-sm text-primary-foreground/80">Secure admin and employee dashboards</p>
              </div>
            </div>

            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mr-4">
                <Users className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Offline Capability</h3>
                <p className="text-sm text-primary-foreground/80">Works seamlessly even without internet</p>
              </div>
            </div>

            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mr-4">
                <BarChart3 className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Analytics</h3>
                <p className="text-sm text-primary-foreground/80">Track sales, inventory, and performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
