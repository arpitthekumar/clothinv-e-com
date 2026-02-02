"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LocationInput from "@/components/ui/LocationInput";
import { useCart } from "./cart-context";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const DELIVERY_ADDR_KEY = "clothinv-delivery-address";
const DELIVERY_PHONE_KEY = "clothinv-delivery-phone";
const LOCATION_FULL_KEY = "user_location_full";

export function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { items, totalAmount, clearCart, updateQuantity } = useCart();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [savedLocation, setSavedLocation] = useState<any | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const returnUrl = encodeURIComponent("/store/checkout");
      router.replace(`/auth?returnUrl=${returnUrl}`);
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Load phone & address from localStorage (frontend-only persistence)
    try {
      const p = typeof window !== "undefined" ? localStorage.getItem(DELIVERY_PHONE_KEY) : null;
      const a = typeof window !== "undefined" ? localStorage.getItem(DELIVERY_ADDR_KEY) : null;
      if (p) setPhone(p);
      if (a) setDeliveryAddress(a);

      // load structured location if available and pre-fill delivery address (override to keep consistent)
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(LOCATION_FULL_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setSavedLocation(parsed);

            // Always prefer saved structured location as canonical delivery text
            const parts: string[] = [];
            if (parsed.addressLine1) parts.push(parsed.addressLine1);
            if (parsed.addressLine2) parts.push(parsed.addressLine2);
            if (parsed.city) parts.push(parsed.city);
            if (parsed.state) parts.push(parsed.state);
            if (parsed.postcode) parts.push(parsed.postcode);
            if (parsed.country) parts.push(parsed.country);
            const addr = parts.join(", ");
            if (addr) {
              setDeliveryAddress(addr);
              try { localStorage.setItem(DELIVERY_ADDR_KEY, addr); } catch (e) {}
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Listen for other tabs/components updating the saved structured location and sync into the delivery textarea
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LOCATION_FULL_KEY) return;
      try {
        const raw = e.newValue;
        const parsed = raw ? JSON.parse(raw) : null;
        setSavedLocation(parsed);
        if (parsed) {
          const parts: string[] = [];
          if (parsed.addressLine1) parts.push(parsed.addressLine1);
          if (parsed.addressLine2) parts.push(parsed.addressLine2);
          if (parsed.city) parts.push(parsed.city);
          if (parsed.state) parts.push(parsed.state);
          if (parsed.postcode) parts.push(parsed.postcode);
          if (parsed.country) parts.push(parsed.country);
          const addr = parts.join(", ");
          if (addr) {
            setDeliveryAddress(addr);
            try { localStorage.setItem(DELIVERY_ADDR_KEY, addr); } catch (err) {}
            toast({ title: 'Delivery address updated', description: 'Synchronized from saved location' });
          }
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // When the saved structured location changes within this component, keep the delivery textarea in sync
  useEffect(() => {
    if (!savedLocation) return;
    const parts: string[] = [];
    if (savedLocation.addressLine1) parts.push(savedLocation.addressLine1);
    if (savedLocation.addressLine2) parts.push(savedLocation.addressLine2);
    if (savedLocation.city) parts.push(savedLocation.city);
    if (savedLocation.state) parts.push(savedLocation.state);
    if (savedLocation.postcode) parts.push(savedLocation.postcode);
    if (savedLocation.country) parts.push(savedLocation.country);
    const addr = parts.join(", ");
    if (addr && addr !== deliveryAddress) {
      setDeliveryAddress(addr);
      try { localStorage.setItem(DELIVERY_ADDR_KEY, addr); } catch (e) {}
      toast({ title: 'Delivery address updated', description: 'Using your saved location' });
    }
  }, [savedLocation]);


  const placeOrder = async () => {
    if (items.length === 0) {
      setError("Cart is empty.");
      return;
    }
    setError(null);
    setPlacing(true);
    try {
      const orderItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        name: i.name,
        sku: i.sku,
      }));
      // Validate phone
      if (!phone || phone.trim().length < 6) {
        throw new Error("Please enter a valid phone number before placing the order.");
      }

      // persist phone & delivery address locally for next time
      try {
        localStorage.setItem(DELIVERY_PHONE_KEY, phone);
        localStorage.setItem(DELIVERY_ADDR_KEY, deliveryAddress);
      } catch (e) {
        // ignore
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          customer_name: user?.fullName || user?.username,
          customer_phone: phone,
          payment_method: "online",
          // deliveryAddress is frontend-only; we don't persist it server-side, but include it in the request body for UX/reporting if desired
          delivery_address: deliveryAddress,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Order failed");
      }

      const created = await res.json();
      const orderId = created.id;

      // Create server-side Razorpay order
      const r = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create payment order");
      }
      const { razorpayOrder, keyId } = await r.json();

      // Load Razorpay checkout script if needed
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load razorpay script"));
          document.head.appendChild(s);
        });
      }

      // Open Razorpay inline checkout
      await new Promise<void>((resolve, reject) => {
        const options: any = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "ClothInv Store",
          description: `Order ${created.invoice_number || created.id}`,
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            try {
              // Verify payment server-side
              const vr = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId,
                }),
              });
              if (!vr.ok) {
                const err = await vr.json().catch(() => ({}));
                reject(new Error(err.error || "Payment verification failed"));
                return;
              }

              resolve();
            } catch (err) {
              reject(err);
            }
          },
          prefill: {
            name: window?.localStorage?.getItem("user_name") || undefined,
          },
          theme: { color: "#2563eb" },
        };
        const rp = new (window as any).Razorpay(options);
        rp.open();
      });

      clearCart();
      router.push("/store/checkout/success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // helpers for per-store delivery estimates
  const toRad = (v: number) => (v * Math.PI) / 180;
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getEstimate = (userLoc: any, storeLoc: any) => {
    try {
      const sLat = storeLoc && (storeLoc.latitude ?? storeLoc.lat) ? parseFloat(storeLoc.latitude ?? storeLoc.lat) : null;
      const sLon = storeLoc && (storeLoc.longitude ?? storeLoc.lng) ? parseFloat(storeLoc.longitude ?? storeLoc.lng) : null;
      const uLat = userLoc && userLoc.coords && userLoc.coords.lat ? Number(userLoc.coords.lat) : null;
      const uLon = userLoc && userLoc.coords && userLoc.coords.lng ? Number(userLoc.coords.lng) : null;

      if (sLat !== null && sLon !== null && uLat !== null && uLon !== null) {
        const km = haversineKm(uLat, uLon, sLat, sLon);
        if (km <= 50) return { min: 1, max: 2, reason: `~${Math.round(km)}km (local)` };
        if (km <= 200) return { min: 2, max: 4, reason: `~${Math.round(km)}km` };
        if (km <= 800) return { min: 4, max: 7, reason: `~${Math.round(km)}km` };
        return { min: 7, max: 14, reason: `~${Math.round(km)}km (long distance)` };
      }

      // fallback: matching postcode/city
      if (userLoc && storeLoc) {
        if (userLoc.postcode && storeLoc.postcode && userLoc.postcode === storeLoc.postcode) return { min: 1, max: 2, reason: "same postcode" };
        if (userLoc.city && storeLoc.city && userLoc.city.toLowerCase() === storeLoc.city.toLowerCase()) return { min: 2, max: 4, reason: "same city" };
      }

      // last resort: moderate default
      return { min: 2, max: 5, reason: "default" };
    } catch (e) {
      return { min: 2, max: 5, reason: "error" };
    }
  };

  const formatRange = (min: number, max: number) => {
    const now = new Date();
    const a = new Date(now);
    a.setDate(now.getDate() + min);
    const b = new Date(now);
    b.setDate(now.getDate() + max);
    return `${a.toLocaleDateString()} – ${b.toLocaleDateString()}`;
  };

  // per-store aggregate state
  const [storeEstimates, setStoreEstimates] = useState<Record<string, { name: string; min: number; max: number; reason?: string }>>({});
  const [combinedEstimate, setCombinedEstimate] = useState<{ min: number; max: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!items || items.length === 0) {
        setStoreEstimates({});
        setCombinedEstimate(null);
        return;
      }

      // map storeId => items
      const storeIds = new Set<string | null>(items.map((i) => i.storeId ?? null));
      const fetches: Array<Promise<{ id: string | null; store: any | null }>> = [];

      for (const sid of storeIds) {
        if (!sid) {
          // platform default
          fetches.push(Promise.resolve({ id: "platform", store: null }));
        } else {
          fetches.push(
            fetch(`/api/stores/${sid}`).then((r) => (r.ok ? r.json() : null)).then((s) => ({ id: sid, store: s }))
          );
        }
      }

      const results = await Promise.all(fetches);
      if (cancelled) return;

      const next: Record<string, { name: string; min: number; max: number; reason?: string }> = {};
      for (const r of results) {
        const id = r.id ?? "platform";
        const store = r.store;
        const name = store?.name ?? "Platform";
        const est = getEstimate(savedLocation, store);
        next[id] = { name, min: est.min, max: est.max, reason: est.reason };
      }

      setStoreEstimates(next);

      // compute combined: the order completes when the slowest store completes
      const mins = Object.values(next).map((s) => s.min);
      const maxs = Object.values(next).map((s) => s.max);
      if (mins.length > 0 && maxs.length > 0) {
        setCombinedEstimate({ min: Math.max(...mins), max: Math.max(...maxs) });
      } else {
        setCombinedEstimate(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items, savedLocation]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center px-4">
          <Link href="/store" className="font-semibold">
            Store
          </Link>
        </div>
      </header>
      <main className="container max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">Checkout</h1>

        {/* delivery estimate summary (per-store breakdown + combined) */}
        <div className="mb-4">
          {savedLocation ? (
            (() => {
              if (!combinedEstimate || Object.keys(storeEstimates).length === 0) {
                return <p className="text-muted-foreground">Delivery estimate unavailable for selected location.</p>;
              }

              return (
                <div className="rounded-md bg-muted/30 p-3 text-sm">
                  <div className="font-medium">Estimated delivery (combined): Approx {combinedEstimate.min}-{combinedEstimate.max} business days ({formatRange(combinedEstimate.min, combinedEstimate.max)})</div>
                  <div className="text-muted-foreground text-sm mt-2">Showing separate estimates per store:</div>

                  <ul className="mt-2 space-y-1">
                    {Object.entries(storeEstimates).map(([sid, s]) => (
                      <li key={sid} className="text-sm">
                        <strong>{s.name}</strong>: Approx {s.min}-{s.max} business days ({formatRange(s.min, s.max)}) {s.reason ? <span className="text-xs text-muted-foreground">— {s.reason}</span> : null}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2"><Button size="sm" variant="outline" onClick={() => setShowLocationEditor((s) => !s)}>{showLocationEditor ? 'Close' : 'Change location'}</Button></div>
                </div>
              );
            })()
          ) : (
            <div className="rounded-md bg-muted/30 p-3 text-sm">
              <div className="text-muted-foreground">No delivery location set. <Button size="sm" onClick={() => setShowLocationEditor(true)}>Set location</Button></div>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground mb-4">
            Your cart is empty. <Link href="/store" className="text-primary underline">Continue shopping</Link>.
          </p>
        ) : (
          <>
            <ul className="space-y-4 mb-6">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between text-sm gap-4"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-muted-foreground text-xs">SKU: {item.sku}</div>
                  </div>

                  <div className="w-32 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, Math.max(1, Number(e.target.value || 1)))}
                      className="w-20 border rounded px-2 py-1 text-sm"
                    />
                    <div className="whitespace-nowrap">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Delivery address (saved locally)</label>
                <div className="flex gap-2 items-start">
                  <textarea
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery address (will be stored locally for next time)"
                    className="w-full border rounded px-3 py-2"
                  />
                  <div className="w-40">
                    <Button size="sm" variant="outline" onClick={() => setShowLocationEditor((s) => !s)}>{showLocationEditor ? "Close" : "Select location"}</Button>
                    <div className="mt-2">
                      <Button size="sm" variant="ghost" onClick={() => {
                        // Use saved structured location to fill address
                        if (savedLocation) {
                          const parts: string[] = [];
                          if (savedLocation.addressLine1) parts.push(savedLocation.addressLine1);
                          if (savedLocation.addressLine2) parts.push(savedLocation.addressLine2);
                          if (savedLocation.city) parts.push(savedLocation.city);
                          if (savedLocation.state) parts.push(savedLocation.state);
                          if (savedLocation.postcode) parts.push(savedLocation.postcode);
                          if (savedLocation.country) parts.push(savedLocation.country);
                          const addr = parts.join(", ");
                          if (addr) {
                            setDeliveryAddress(addr);
                            try { localStorage.setItem(DELIVERY_ADDR_KEY, addr); } catch (e) {}
                          }
                        }
                      }}>{savedLocation ? "Use saved" : "No saved location"}</Button>
                    </div>
                  </div>
                </div>

                {showLocationEditor && (
                  <div className="mt-3">
                    <LocationInput value={savedLocation ?? undefined} onChange={(v) => {
                      setSavedLocation(v);
                      // update short stored label for consistency
                      try { if (v) localStorage.setItem(LOCATION_FULL_KEY, JSON.stringify(v)); else localStorage.removeItem(LOCATION_FULL_KEY); } catch (e) {}
                      // optionally auto-fill textarea
                      const parts: string[] = [];
                      if (v?.addressLine1) parts.push(v.addressLine1);
                      if (v?.addressLine2) parts.push(v.addressLine2);
                      if (v?.city) parts.push(v.city);
                      if (v?.state) parts.push(v.state);
                      if (v?.postcode) parts.push(v.postcode);
                      if (v?.country) parts.push(v.country);
                      const addr = parts.join(", ");
                      if (addr) setDeliveryAddress(addr);
                    }} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="font-semibold">Total: ₹{totalAmount}</div>
                <div className="text-sm text-muted-foreground">Items: {items.length}</div>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm mb-4">{error}</p>
            )}

            <Button
              className="w-full"
              disabled={placing}
              onClick={placeOrder}
            >
              {placing ? "Placing order…" : "Place order"}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
