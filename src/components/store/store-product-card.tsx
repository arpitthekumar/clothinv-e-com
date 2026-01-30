"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "./cart-context";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
  description?: string | null;
  image?: string | null;
};

export function StoreProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const outOfStock = product.stock <= 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image.startsWith("data:") ? product.image : product.image}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <CardContent className="pt-4 flex-1">
        <h3 className="font-semibold truncate">{product.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{product.sku}</p>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="mt-2 font-medium">
          ₹{parseFloat(product.price || "0").toFixed(2)}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={outOfStock}
          onClick={() =>
            addItem({
              productId: product.id,
              name: product.name,
              sku: product.sku,
              price: product.price,
              quantity: 1,
            })
          }
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}
