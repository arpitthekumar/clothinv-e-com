"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import LocationInput from "@/components/ui/LocationInput";
import { useCart } from "@/components/store/cart-context";
import { toast } from "@/hooks/use-toast"; 

export default function ProductDetailClient({ product, related = [] }: { product: any; related?: any[] }) {
  const { addItem, clearCart } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [savedLocation, setSavedLocation] = useState<any | null>(null);
  const [showLocationEditor, setShowLocationEditor] = useState(false);

  const formatEstimatedRange = (minDays: number, maxDays: number) => {
    const now = new Date();
    const a = new Date(now);
    a.setDate(now.getDate() + minDays);
    const b = new Date(now);
    b.setDate(now.getDate() + maxDays);
    const fmt = (d: Date) => d.toLocaleDateString();
    return `${fmt(a)} – ${fmt(b)}`;
  };

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getEstimate = (userLoc: any, storeLoc: any) => {
    // Prefer precise coords when available
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


  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);

  // load saved location from localStorage
  const LOCATION_FULL_KEY = "user_location_full";
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(LOCATION_FULL_KEY);
        if (raw) setSavedLocation(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const addToCart = async () => {
    setAdding(true);
    try {
      addItem({ productId: product.id, name: product.name, sku: product.sku, price: product.price, quantity: 1, storeId: product.storeId ?? null });
      toast({ title: 'Added to cart', description: product.name });
    } catch (err) {
      console.error('Add to cart failed', err);
      toast({ title: 'Add failed', description: 'Could not add item to cart', variant: 'destructive' as any });
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    setAdding(true);
    try {
      // Replace cart with this item and go to checkout
      clearCart();
      addItem({ productId: product.id, name: product.name, sku: product.sku, price: product.price, quantity: 1, storeId: product.storeId ?? null });
      toast({ title: 'Proceeding to checkout', description: product.name });
      router.push("/store/checkout");
    } catch (err) {
      console.error('Buy now failed', err);
      toast({ title: 'Error', description: 'Could not start checkout', variant: 'destructive' as any });
    } finally {
      setAdding(false);
    }
  };
  const [origin, setOrigin] = useState({ x: "50%", y: "50%" });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setOrigin({
      x: `${x}%`,
      y: `${y}%`,
    });
  };

  return (
    <div className="space-y-6">
      <Button onClick={() => router.back()}>← Back</Button>
      <div className="flex gap-6 flex-col md:flex-row">
        <div className="w-full md:w-1/2">
          <div className="sticky top-8">
            <div
              className="w-full  rounded-4xl overflow-hidden relative cursor-zoom-in"
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => {
                setZoom(false);
                setOrigin({ x: "50%", y: "50%" });
              }}
              onMouseMove={handleMouseMove}
              onDoubleClick={() => setLightboxOpen(true)}
            >

              {images.length > 0 ? (
                <img
                  src={images[current]}
                  alt={product.name}
                  style={{
                    transform: zoom ? "scale(2)" : "scale(1)",
                    transformOrigin: `${origin.x} ${origin.y}`,
                  }}
                  className="w-full h-full object-cover transition-transform duration-200 ease-out"
                />

              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">No image</div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    className={`w-20 h-20 border ${idx === current ? 'ring-2 ring-primary' : ''}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            SKU: {product.sku ?? "—"} • Stock: {product.stock ?? "—"} • Store: {product.storeName ?? "Platform"} • Added: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
          </p>

          <p className={`mt-4 ${expanded ? '' : 'line-clamp-3'}`}>{product.description}</p>
          {product.description && product.description.length > 200 && (
            <button className="text-primary text-sm mt-2" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show more'}</button>
          )}
          <p className="mt-4 text-xl font-medium">₹{parseFloat(product.price || "0").toFixed(2)}</p>

          <div className="flex gap-2 mt-6">
            <Button onClick={addToCart} disabled={adding}>Add to cart</Button>
            <Button onClick={buyNow} variant="secondary" disabled={adding}>Buy now</Button>
          </div>
          {product.size && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Available Size</p>

              <div className="flex flex-wrap gap-2">
                {product.size.split(",").map((s: string) => (
                  <button
                    key={s}
                    className="
            px-4 py-2 rounded-lg border
            text-sm font-medium
            hover:border-primary
            transition
          "
                  >
                    {s.trim()}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 rounded-xl border p-4 text-sm space-y-2">
            <p className="font-medium">Delivery & Returns</p>

            <p className="text-muted-foreground">
              Free delivery available on eligible orders.
            </p>

            <p className="text-muted-foreground">
              Easy 7-day return policy.
            </p>

            <p className="text-muted-foreground">
              Secure packaging from verified sellers.
            </p>

            {/* Delivery estimate based on saved location */}
            <div className="mt-2">
              {savedLocation ? (
                (() => {
                  const est = getEstimate(savedLocation, product.store);
                  if (!est) return <p className="text-muted-foreground">Estimated delivery unavailable.</p>;
                  const range = formatEstimatedRange(est.min, est.max);
                  return (
                    <div>
                      <p className="font-medium">Estimated delivery</p>
                      <p className="text-muted-foreground">Approx {est.min}-{est.max} business days ({range}) to <strong>{savedLocation.postcode ?? (savedLocation.city ?? 'your location')}</strong>{product.store?.name ? ` from ${product.store.name}` : ''} <span className="text-xs text-muted-foreground">{est.reason ? `— ${est.reason}` : ''}</span></p>
                      <div className="mt-2"><Button size="sm" variant="outline" onClick={() => setShowLocationEditor((s) => !s)}>{showLocationEditor ? 'Close' : 'Change location'}</Button></div>
                    </div>
                  );
                })()
              ) : (
                <div>
                  <p className="text-muted-foreground">Please select a delivery location or PIN code to see estimated delivery time.</p>
                  <div className="mt-2"><Button size="sm" onClick={() => setShowLocationEditor(true)}>Select location</Button></div>
                </div>
              )}

              {showLocationEditor && (
                <div className="mt-2">
                  <LocationInput value={savedLocation ?? undefined} onChange={(v) => {
                    setSavedLocation(v);
                    try { if (v) localStorage.setItem('user_location_full', JSON.stringify(v)); else localStorage.removeItem('user_location_full'); } catch (e) {}
                    setShowLocationEditor(false);
                  }} />
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="border rounded-lg p-3">
              🚚 Fast Delivery
            </div>
            <div className="border rounded-lg p-3">
              🔒 Secure Payment
            </div>
            <div className="border rounded-lg p-3">
              ↩️ Easy Returns
            </div>
            <div className="border rounded-lg p-3">
              ⭐ Verified Seller
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">More from this store</h3>
            <Link href="/store">View store</Link>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Product details</h3>
        <div className="mt-2">{product.description}</div>
      </div>

      {related && related.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">More you might like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.map((r) => (
              <div key={r.id} className="border p-2">
                <Link href={`/store/product/${r.slug ?? r.id}`}>
                  <img src={r.image} alt={r.name} className="w-full h-32 object-cover" />
                  <p className="text-sm mt-1 truncate">{r.name}</p>
                  <p className="text-sm font-medium">₹{parseFloat(r.price || '0').toFixed(2)}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <img src={images[current]} alt={product.name} className="max-w-[90%] max-h-[90%] object-contain" />
        </div>
      )}
    </div>
  );
}
