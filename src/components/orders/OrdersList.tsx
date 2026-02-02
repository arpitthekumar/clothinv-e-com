"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import OrderCard from "./OrderCard";
import { Button } from "@/components/ui/button";

export default function OrdersList({ ordersQuery, onUpdateStatus }: any) {
  const orders = ordersQuery?.data?.pages?.flatMap((page: any) => page.data) ?? [];
  const hasMore = ordersQuery?.hasNextPage;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders ({orders.length})</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {ordersQuery.isLoading ? (
          <p className="text-center py-6 text-muted-foreground">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">No orders found.</p>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order: any) => (
                <OrderCard key={`${order.id}-${order.created_at}`} order={order} onUpdateStatus={onUpdateStatus} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => ordersQuery.fetchNextPage()} disabled={ordersQuery.isFetchingNextPage}>
                  {ordersQuery.isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}

            {!hasMore && !ordersQuery.isFetchingNextPage && (
              <p className="text-center text-sm text-muted-foreground py-4">No more orders to load</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
