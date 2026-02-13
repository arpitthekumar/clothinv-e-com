"use client";
import { Sidebar } from "@/components/shared/sidebar";
import { CategoriesManagement } from "@/components/pages/categories-management";
import { Header } from "@/components/shared/header";
import { useAuth } from "@/hooks/use-auth";
import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Shield } from "lucide-react";

export default function CategoriesPage() {
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
    if (user?.role !== "admin") {
        return (
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar isOpen={sidebarOpen} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header
                        title="Categories"
                        subtitle="Manage product categories"
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
        <div className="flex h-screen bg-background">
            <Sidebar isOpen />
            <div className="flex-1 flex flex-col">
                <Header
                    title="Categories"
                    subtitle="Manage product categories"
                    onSidebarToggle={toggleSidebar}
                />
                < main className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Folder className="mr-2 text-primary" />
                                    Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CategoriesManagement />
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
