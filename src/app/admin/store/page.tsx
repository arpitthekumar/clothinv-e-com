"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/app/_components/require-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LocationInput from "@/components/ui/LocationInput";
import { toast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

function StoreEditor() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [store, setStore] = useState<any | null>(null);
    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await fetch('/api/admin/store');
            if (!res.ok) {
                setStore(null);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setStore(data);
            setLoading(false);
        })();
    }, []);

    const handleSave = async () => {
        if (!store) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/store', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(store) });
            if (!res.ok) throw new Error('Failed to save');
            const data = await res.json();
            setStore(data);
            toast({ title: 'Saved', description: 'Store details updated successfully.' });
        } catch (err) {
            console.error(err);
            toast({ title: 'Save failed', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-muted-foreground">Loading…</p>;
    if (!store) return <p className="text-destructive">Store not found or not assigned to your account.</p>;

    return (
        <div className="flex flex-col gap-4 max-w-lg">

            <div>
                <label className="block text-sm font-medium">Store name</label>
                <Input value={store.name || ""} onChange={(e) => setStore((s: any) => ({ ...s, name: e.target.value }))} />
            </div>

            <div>
                <label className="block text-sm font-medium">Address</label>
                <Input value={store.address_line1 || store.addressLine1 || ""} onChange={(e) => setStore((s: any) => ({ ...s, address_line1: e.target.value }))} placeholder="Address line 1" />
                <Input value={store.address_line2 || store.addressLine2 || ""} onChange={(e) => setStore((s: any) => ({ ...s, address_line2: e.target.value }))} placeholder="Address line 2" className="mt-2" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input value={store.city || ""} onChange={(e) => setStore((s: any) => ({ ...s, city: e.target.value }))} placeholder="City" />
                    <Input value={store.state || ""} onChange={(e) => setStore((s: any) => ({ ...s, state: e.target.value }))} placeholder="State" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input value={store.postcode || ""} onChange={(e) => setStore((s: any) => ({ ...s, postcode: e.target.value }))} placeholder="Postcode" />
                    <Input value={store.country || ""} onChange={(e) => setStore((s: any) => ({ ...s, country: e.target.value }))} placeholder="Country" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Coordinates</label>
                <div className="flex gap-2">
                    <Input value={store.latitude || ""} onChange={(e) => setStore((s: any) => ({ ...s, latitude: e.target.value }))} placeholder="Latitude" />
                    <Input value={store.longitude || ""} onChange={(e) => setStore((s: any) => ({ ...s, longitude: e.target.value }))} placeholder="Longitude" />
                </div>
                <div className="mt-2">
                    <LocationInput value={store} onChange={(v) => {
                        // LocationInput returns our structured object — map fields back to store fields
                        setStore((s: any) => ({
                            ...s,
                            address_line1: v?.addressLine1 ?? s.address_line1,
                            address_line2: v?.addressLine2 ?? s.address_line2,
                            city: v?.city ?? s.city,
                            state: v?.state ?? s.state,
                            postcode: v?.postcode ?? s.postcode,
                            country: v?.country ?? s.country,
                            latitude: v?.coords?.lat?.toString() ?? s.latitude,
                            longitude: v?.coords?.lng?.toString() ?? s.longitude,
                        }));
                    }} />
                </div>

            </div>

            <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save store'}</Button>
            </div>
        </div>
    );
}

export default function Page() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const toggleSidebar = () => setSidebarOpen((o) => !o);

    return (
        <RequireAuth>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar isOpen={sidebarOpen} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header
                        title="Settings"
                        subtitle="Manage system settings and users"
                        onSidebarToggle={toggleSidebar}
                    />
                    <main className="flex-1 overflow-auto p-6">
                        <div className="max-w-2xl mx-auto">
                        <StoreEditor /></div>
                    </main>
                </div>
            </div>
        </RequireAuth>
    );
}