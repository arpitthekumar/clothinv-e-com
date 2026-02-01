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
  slug?: string | null;
};

export function StoreProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const outOfStock = product.stock <= 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image ? (
          <a href={`/store/product/${product.slug ?? product.id}`} aria-label={`View ${product.name}`}>
            <img
              src={(() => {
                try {
                  // lazy import helper to ensure env var usage
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { getPublicImageUrl } = require("@/lib/media");
                  return getPublicImageUrl(product.image) || product.image;
                } catch (e) {
                  return product.image;
                }
              })()}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </a>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <CardContent className="pt-4 flex-1">
        <h3 className="font-semibold truncate"><a href={`/store/product/${product.slug ?? product.id}`}>{product.name}</a></h3>
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
