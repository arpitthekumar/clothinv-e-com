import type { SupabaseServerClient } from "../supabase.client";

export async function getNotSellingProducts(
  client: SupabaseServerClient,
  params: {
    sinceDays: number;
    fromDate?: Date;
    toDate?: Date;
  }
) {
  const { sinceDays, fromDate, toDate } = params;
  let cutoffDate: Date;
  if (fromDate) {
    cutoffDate = new Date(fromDate);
  } else {
    cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - sinceDays);
  }
  const { data: products, error: productsError } = await client
    .from("products")
    .select("id, name, sku, stock, deleted_at, deleted")
    .order("name", { ascending: true });
  if (productsError) throw productsError;
  let salesQuery = client
    .from("sales")
    .select("created_at, items, deleted")
    .eq("deleted", false);
  if (fromDate && toDate) {
    salesQuery = salesQuery
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString());
  } else {
    salesQuery = salesQuery.gte("created_at", cutoffDate.toISOString());
  }
  const { data: sales, error: salesError } = await salesQuery;
  if (salesError) throw salesError;
  const productsSoldInPeriod: Set<string> = new Set();
  for (const sale of sales) {
    try {
      const items = Array.isArray(sale.items)
        ? sale.items
        : JSON.parse(sale.items || "[]");
      for (const item of items) {
        if (!item.productId) continue;
        productsSoldInPeriod.add(item.productId);
      }
    } catch (err) {
      console.error("Error parsing sale items:", err);
    }
  }
  const { data: allSales, error: allSalesError } = await client
    .from("sales")
    .select("created_at, items, deleted")
    .eq("deleted", false);
  if (allSalesError) throw allSalesError;
  const lastSoldMap: Record<string, string> = {};
  for (const sale of allSales || []) {
    try {
      const items = Array.isArray(sale.items)
        ? sale.items
        : JSON.parse(sale.items || "[]");
      for (const item of items) {
        if (!item.productId) continue;
        const productId = item.productId;
        const saleDate = new Date(sale.created_at);
        if (
          !lastSoldMap[productId] ||
          new Date(lastSoldMap[productId]) < saleDate
        ) {
          lastSoldMap[productId] = saleDate.toISOString();
        }
      }
    } catch (err) {
      console.error("Error parsing sale items:", err);
    }
  }
  const notSelling = products
    .filter((p: any) => {
      const wasSoldInPeriod = productsSoldInPeriod.has(p.id);
      const isDeleted = p.deleted || !!p.deleted_at;
      return !wasSoldInPeriod && !isDeleted;
    })
    .map((p: any) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      lastSoldAt: lastSoldMap[p.id] || null,
      deleted_at: p.deleted_at,
      isDeleted: p.deleted || false,
    }));
  return notSelling;
}

export async function getStockValuation(client: SupabaseServerClient) {
  const { data: products, error } = await client
    .from("products")
    .select("id, name, stock, price, buying_price, deleted");
  if (error) throw error;
  const validProducts = (products || []).filter((p: any) => !p.deleted);
  let totalValuation = 0;
  let totalCost = 0;
  const byProduct = validProducts.map((p: any) => {
    const stock = Number(p.stock ?? 0);
    const costPrice = Number(p.buying_price ?? 0);
    const sellingPrice = Number(p.price ?? 0);
    const valuation = stock * sellingPrice;
    const totalProductCost = stock * costPrice;
    totalValuation += valuation;
    totalCost += totalProductCost;
    return {
      productId: p.id,
      name: p.name,
      stock,
      costPrice,
      sellingPrice,
      totalCost: totalProductCost,
      valuation,
    };
  });
  return { totalCost, totalValuation, byProduct };
}

export async function getProfitMargins(
  client: SupabaseServerClient,
  params: { sinceDays: number; fromDate?: Date; toDate?: Date }
) {
  let since: Date;
  if (params.fromDate) {
    since = new Date(params.fromDate);
  } else {
    since = new Date();
    since.setDate(since.getDate() - params.sinceDays);
  }
  const { data, error } = await client.rpc("profit_margins", {
    since_ts: since.toISOString(),
  });
  if (error) throw error;
  let result = data as any;
  if (params.toDate && result) {
    const toDate = new Date(params.toDate);
    toDate.setHours(23, 59, 59, 999);
    if (params.fromDate && params.toDate) {
      const { data: sales, error: salesError } = await client
        .from("sales")
        .select("items, created_at, total_amount, discount_amount")
        .eq("deleted", false)
        .gte("created_at", params.fromDate.toISOString())
        .lte("created_at", toDate.toISOString());
      if (!salesError && sales) {
        const { data: products } = await client
          .from("products")
          .select("id, name, price, buying_price");
        const productMap: Record<string, any> = {};
        for (const p of products || []) {
          productMap[p.id] = p;
        }
        let totalProfit = 0;
        const byProduct: Record<
          string,
          {
            productId: string;
            name: string;
            quantity: number;
            revenue: number;
            cost: number;
            profit: number;
            marginPercent: number;
          }
        > = {};
        for (const sale of sales) {
          let items: any[] = [];
          try {
            items = Array.isArray(sale.items)
              ? sale.items
              : JSON.parse(sale.items || "[]");
          } catch (e) {
            continue;
          }
          const discountAmount =
            Number((sale as any).discount_amount || 0) || 0;
          const subtotal = items.reduce(
            (sum: number, it: any) =>
              sum + Number(it.quantity || 0) * Number(it.price || 0),
            0
          );
          const discountRate =
            subtotal > 0 ? Math.min(discountAmount / subtotal, 1) : 0;
          for (const item of items) {
            const productId = item.productId;
            const product = productMap[productId];
            if (!product) continue;
            const qty = Number(item.quantity || 0);
            const sellingPrice = Number(item.price || 0);
            const costPrice = Number(
              product.buying_price || product.price || 0
            );
            const revenue = qty * sellingPrice * (1 - discountRate);
            const cost = qty * costPrice;
            const profit = revenue - cost;
            totalProfit += profit;
            if (!byProduct[productId]) {
              byProduct[productId] = {
                productId,
                name: product.name || "Unknown",
                quantity: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                marginPercent: 0,
              };
            }
            byProduct[productId].quantity += qty;
            byProduct[productId].revenue += revenue;
            byProduct[productId].cost += cost;
            byProduct[productId].profit += profit;
          }
        }
        for (const key in byProduct) {
          const p = byProduct[key];
          p.marginPercent =
            p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
        }
        result = {
          totalProfit,
          byProduct: Object.values(byProduct),
        };
      }
    }
  }
  return result;
}
