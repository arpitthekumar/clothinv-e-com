import {
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Sale,
  type InsertSale,
  type StockMovement,
  type InsertStockMovement,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsers(): Promise<User[]>;
  /** Users belonging to a store (admin sees only their store's users). */
  getUsersByStore(storeId: string): Promise<User[]>;
  getStores(): Promise<Array<{ id: string; name: string }>>;

  getCategories(): Promise<Category[]>;
  /** Categories visible on store (visibility=online, approval_status=approved) */
  getCategoriesForStore(storeId?: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(
    id: string,
    category: Partial<InsertCategory>
  ): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  getProducts(includeDeleted?: boolean): Promise<Product[]>;
  /** Products visible on e-commerce store (visibility online or both, not deleted).
   * Optional filters: categorySlug, minPrice, maxPrice (all strings because they come from query params).
   */
  getProductsForStore(storeId?: string, filters?: { categorySlug?: string; minPrice?: string; maxPrice?: string }): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    product: Partial<InsertProduct>
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateStock(id: string, quantity: number): Promise<Product | undefined>;
  softDeleteProduct: (id: string) => Promise<boolean>;
  restoreProduct: (id: string) => Promise<boolean>;

  getSales(includeDeleted?: boolean): Promise<Sale[]>;
  getSalesByUser(userId: string, includeDeleted?: boolean): Promise<Sale[]>;
  /** Sales where customer_id = customerId (online order history) */
  getSalesByCustomer(customerId: string): Promise<Sale[]>;
  getSalesToday(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  softDeleteSale(saleId: string): Promise<boolean>;
  restoreSale(saleId: string): Promise<boolean>;
  deleteSale(saleId: string): Promise<boolean>;

  // Orders (online e-commerce order lifecycle)
  getOrders(includeProcessed?: boolean): Promise<import("@shared/schema").Order[]>;
  getOrderById(id: string): Promise<import("@shared/schema").Order | undefined>;
  getOrdersByStore(storeId: string): Promise<import("@shared/schema").Order[]>;
  getOrdersByCustomer(customerId: string): Promise<import("@shared/schema").Order[]>;
  createOrder(order: import("@shared/schema").InsertOrder): Promise<import("@shared/schema").Order>;
  updateOrderStatus(id: string, status: string, processedBy?: string): Promise<import("@shared/schema").Order | undefined>;
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByProduct(productId: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  createSaleItems(
    saleId: string,
    items: Array<{
      productId: string;
      quantity: number;
      price: string;
      name: string;
      sku: string;
    }>
  ): Promise<void>;
  createSalesReturn(params: {
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
  }): Promise<{ salesReturnId: string }>;

  getPromotions(storeId?: string): Promise<import("@shared/schema").Promotion[]>;
  createPromotion(
    promo: import("@shared/schema").InsertPromotion
  ): Promise<import("@shared/schema").Promotion>;
  addPromotionTarget(
    target: import("@shared/schema").InsertPromotionTarget
  ): Promise<import("@shared/schema").PromotionTarget>;
  getPromotionTargets(storeId?: string): Promise<import("@shared/schema").PromotionTarget[]>; 

  getNotSellingProducts(params: {
    sinceDays: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<
    Array<{
      productId: string;
      name: string;
      sku: string;
      stock: number;
      lastSoldAt: string | null;
      deleted_at: string | null;
      isDeleted: boolean;
    }>
  >;
  getStockValuation(): Promise<{
    totalCost: number;
    totalValuation: number;
    byProduct: Array<{
      productId: string;
      name: string;
      stock: number;
      costPrice: number;
      sellingPrice: number;
      totalCost: number;
      valuation: number;
    }>;
  }>;
  getProfitMargins(params: {
    sinceDays: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    totalProfit: number;
    byProduct: Array<{
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
      marginPercent: number;
    }>;
  }>;

  createPayment(
    payment: import("@shared/schema").InsertPayment
  ): Promise<import("@shared/schema").Payment>;
  updatePayment(
    id: string,
    data: Partial<import("@shared/schema").InsertPayment>
  ): Promise<import("@shared/schema").Payment | undefined>;

  getDiscountCoupons(storeId?: string): Promise<import("@shared/schema").DiscountCoupon[]>;
  createDiscountCoupon(
    coupon: import("@shared/schema").InsertDiscountCoupon
  ): Promise<import("@shared/schema").DiscountCoupon>;
  getDiscountCouponByName(
    name: string
  ): Promise<import("@shared/schema").DiscountCoupon | undefined>;
  updateDiscountCoupon(
    id: string,
    coupon: Partial<import("@shared/schema").InsertDiscountCoupon>
  ): Promise<import("@shared/schema").DiscountCoupon | undefined>;
  deleteDiscountCoupon(id: string): Promise<boolean>;

  // Merchant requests (Super Admin governance)
  getMerchantRequests(status?: "pending" | "approved" | "rejected"): Promise<import("@shared/schema").MerchantRequest[]>;
  createMerchantRequest(data: import("@shared/schema").InsertMerchantRequest): Promise<import("@shared/schema").MerchantRequest>;
  updateMerchantRequest(id: string, data: { status: string; reviewedBy?: string }): Promise<import("@shared/schema").MerchantRequest | undefined>;
}
