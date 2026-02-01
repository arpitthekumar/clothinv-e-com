"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-context";

export default function ProductDetailClient({ product }: { product: any }) {
  const { addItem, clearCart } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

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
    <div className="space-y-4">
      <div className="flex gap-6 flex-col md:flex-row">
        <div className="w-full md:w-1/2">
          <div className="sticky top-8">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-[500px] object-contain hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-[500px] bg-muted flex items-center justify-center">No image</div>
            )}
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{product.sku}</p>
          <p className="mt-4">{product.description}</p>
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
    </div>
  );
}
