"use client";
import { CouponsManagement } from "@/components/pages/coupons-management";
import { Header } from "@/components/shared/header";
import { Sidebar } from "@/components/shared/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Percent, Shield } from "lucide-react";
import { useEffect, useState } from "react";


export default function CouponsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user } = useAuth();

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };
    useEffect(() => {
        const isMobile = window.innerWidth < 768; // md breakpoint
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, []);
    // Only allow admins to access settings
    if (user?.role !== "admin") {
        return (
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar isOpen={sidebarOpen} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header
                        title="Settings"
                        subtitle="Access denied"
                        onSidebarToggle={toggleSidebar}
                    />

                    <main className="flex-1 overflow-auto p-6">
                        <div className="max-w-2xl mx-auto">
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                                    <p className="text-muted-foreground">
                                        Only administrators can access the settings page.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
        );
    }
    return (
        <div className="flex h-screen overflow-hidden bg-background">

            <Sidebar isOpen={sidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Discount Coupons"
                    subtitle="Manage discount coupons"
                    onSidebarToggle={toggleSidebar}
                />
                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Percent className="mr-2 text-primary" />
                                    Discount Coupons
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CouponsManagement />
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>);
}
