import type { SupabaseServerClient } from "../supabase.client";

export async function createSaleItems(
  client: SupabaseServerClient,
  saleId: string,
  items: Array<{
    productId: string;
    quantity: number;
    price: string;
    name: string;
    sku: string;
  }>
): Promise<void> {
  for (const it of items) {
    const { error } = await client.from("sale_items").insert({
      sale_id: saleId,
      product_id: it.productId,
      quantity: it.quantity as any,
      price: it.price as any,
      name: it.name,
      sku: it.sku,
    } as any);
    if (error) throw error;
  }
}

export async function createSalesReturn(
  client: SupabaseServerClient,
  params: {
    saleId: string;
    customerId?: string;
    reason?: string;
    items: Array<{
      productId: string;
      saleItemId?: string;
      quantity: number;
      refundAmount?: string;
    }>;
    userId: string;
  }
): Promise<{ salesReturnId: string }> {
  const { saleId, customerId, reason, items, userId } = params;
  const { data: sr, error: srErr } = await client
    .from("sales_returns")
    .insert({ sale_id: saleId, customer_id: customerId || null, reason })
    .select("id")
    .single();
  if (srErr) throw srErr;
  const returnId = sr.id;
  for (const it of items) {
    let saleItemId = it.saleItemId;
    if (!saleItemId) {
      const { data: saleItem, error: findErr } = await client
        .from("sale_items")
        .select("id")
        .eq("sale_id", saleId)
        .eq("product_id", it.productId)
        .maybeSingle();
      if (findErr) throw findErr;
      saleItemId = saleItem?.id || null;
      if (!saleItemId) {
        const { data: saleData, error: saleErr } = await client
          .from("sales")
          .select("items")
          .eq("id", saleId)
          .single();
        if (saleErr) throw saleErr;
        const parsed = Array.isArray(saleData.items)
          ? saleData.items
          : JSON.parse(saleData.items || "[]");
        const original = parsed.find((x: any) => x.productId === it.productId);
        if (!original)
          throw new Error(`Product ${it.productId} not in sale.`);
        const { data: newSaleItem, error: createErr } = await client
          .from("sale_items")
          .insert({
            sale_id: saleId,
            product_id: it.productId,
            quantity: original.quantity,
            price: original.price,
            name: original.name,
            sku: original.sku,
          })
          .select("id")
          .single();
        if (createErr) throw createErr;
        saleItemId = newSaleItem.id;
      }
    }
    const { error: sriErr } = await client
      .from("sales_return_items")
      .insert({
        sales_return_id: returnId,
        sale_item_id: saleItemId,
        product_id: it.productId,
        quantity: it.quantity,
        refund_amount: it.refundAmount ?? null,
      });
    if (sriErr) throw sriErr;
    const { data: prod, error: prodErr } = await client
      .from("products")
      .select("stock")
      .eq("id", it.productId)
      .maybeSingle();
    if (prodErr) throw prodErr;
    const newStock = Number(prod?.stock || 0) + it.quantity;
    const { error: updErr } = await client
      .from("products")
      .update({ stock: newStock })
      .eq("id", it.productId);
    if (updErr) throw updErr;
    const { error: moveErr } = await client
      .from("stock_movements")
      .insert({
        product_id: it.productId,
        user_id: userId,
        type: "return_in",
        quantity: it.quantity,
        reason: `Sales return for sale ${saleId}`,
        ref_table: "sales_return_items",
        ref_id: returnId,
      });
    if (moveErr) throw moveErr;
  }
  const { data: saleMeta, error: saleMetaErr } = await client
    .from("sales")
    .select("items, discount_type, discount_value, tax_percent")
    .eq("id", saleId)
    .single();
  if (saleMetaErr) throw saleMetaErr;
  const originalItems = Array.isArray(saleMeta.items)
    ? saleMeta.items
    : JSON.parse(saleMeta.items || "[]");
  for (const ret of items) {
    const idx = originalItems.findIndex(
      (i: any) => i.productId === ret.productId
    );
    if (idx >= 0) {
      originalItems[idx].quantity = Math.max(
        0,
        originalItems[idx].quantity - ret.quantity
      );
    }
  }
  const updatedItems = originalItems.filter((i: any) => i.quantity > 0);
  let newSubtotal = 0;
  for (const item of updatedItems) {
    newSubtotal += Number(item.price) * Number(item.quantity);
  }
  const discountType = saleMeta.discount_type || "none";
  const discountValue = Number(saleMeta.discount_value || 0);
  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (newSubtotal * discountValue) / 100;
  } else if (discountType === "flat") {
    discountAmount = discountValue;
  }
  const taxPercent = Number(saleMeta.tax_percent || 0);
  const taxableAmount = newSubtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const newTotal = taxableAmount + taxAmount;
  const { error: finalErr } = await client
    .from("sales")
    .update({
      items: updatedItems,
      subtotal: newSubtotal,
      discount_amount: discountAmount,
      discount_value: discountValue,
      tax_percent: taxPercent,
      tax_amount: taxAmount,
      total_amount: newTotal,
    })
    .eq("id", saleId);
  if (finalErr) throw finalErr;
  return { salesReturnId: returnId };
}
