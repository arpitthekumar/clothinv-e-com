"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-context";

export default function ProductDetailClient({ product, related = [] }: { product: any; related?: any[] }) {
  const { addItem, clearCart } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);

  const addToCart = async () => {
    setAdding(true);
    try {
      addItem({ productId: product.id, name: product.name, sku: product.sku, price: product.price, quantity: 1 });
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    setAdding(true);
    try {
      // Replace cart with this item and go to checkout
      clearCart();
      addItem({ productId: product.id, name: product.name, sku: product.sku, price: product.price, quantity: 1 });
      router.push("/store/checkout");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-6 flex-col md:flex-row">
        <div className="w-full md:w-1/2">
          <div className="sticky top-8">
            <div
              className="w-full h-[500px] rounded-4xl  overflow-hidden relative"
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onDoubleClick={() => setLightboxOpen(true)}
            >
              {images.length > 0 ? (
                <img
                  src={images[current]}
                  alt={product.name}
                  style={{ transform: zoom ? 'scale(2)' : 'scale(1)', transformOrigin: 'center center' }}
                  className="w-full h-full object-fill transition-transform duration-200"
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
