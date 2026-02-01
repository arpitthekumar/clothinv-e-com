"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { User, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default function OrderCard({ order, onUpdateStatus }: any) {
  const createdDate = (() => {
    try {
      const utcDate = new Date((order.created_at || "").replace(" ", "T") + "Z");
      return formatDistanceToNow(toZonedTime(utcDate, "Asia/Kolkata"), {
        addSuffix: true,
      });
    } catch {
      return "Invalid date";
    }
  })();

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between mb-3">
        <div>
          <h3 className="font-semibold">{order.invoice_number ?? order.id}</h3>
          <p className="text-sm text-muted-foreground">{createdDate}</p>
          <Badge variant={order.status === "cancelled" ? "destructive" : "default"}>{order.status}</Badge>
        </div>

        <div className="text-right">
          <p className="font-semibold">₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</p>
          <p className="text-sm text-muted-foreground">{order.payment_status ?? "unpaid"}</p>
        </div>
      </div>

      <div className="flex gap-3 text-sm text-muted-foreground mb-3">
        <User className="h-4 w-4" /> Customer: {order.customer_name ?? (order.customer_id || "—").slice?.(0, 8)}
        <Package className="h-4 w-4" /> {(Array.isArray(order.items) ? order.items.length : JSON.parse(order.items || '[]').length)} items
      </div>

      <Separator className="my-3" />

      <div className="flex gap-2 flex-wrap">
        {order.status === "created" && (
          <>
            <Button size="sm" onClick={() => onUpdateStatus({ id: order.id, status: "packed" })}>Mark Packed</Button>
            <Button size="sm" variant="destructive" onClick={() => onUpdateStatus({ id: order.id, status: "cancelled" })}>Cancel</Button>
          </>
        )}

        {order.status === "packed" && (
          <>
            <Button size="sm" onClick={() => onUpdateStatus({ id: order.id, status: "shipped" })}>Mark Shipped</Button>
            <Button size="sm" variant="destructive" onClick={() => onUpdateStatus({ id: order.id, status: "cancelled" })}>Cancel</Button>
          </>
        )}

        {order.status === "shipped" && (
          <>
            <Button size="sm" onClick={() => onUpdateStatus({ id: order.id, status: "delivered" })}>Mark Delivered</Button>
            <Button size="sm" variant="destructive" onClick={() => onUpdateStatus({ id: order.id, status: "cancelled" })}>Cancel</Button>
          </>
        )}

        {order.status === "cancelled" && (
          <p className="text-sm text-muted-foreground">Cancelled</p>
        )}
      </div>
    </div>
  );
}
