/**
 * Supabase storage service — composes domain impls.
 * Single IStorage implementation; logic lives in storage/impl/*.ts.
 */
import { getSupabaseServer } from "./supabase.client";
import type { IStorage } from "./interface";
import type {
  User,
  InsertUser,
  Product,
  InsertProduct,
  Category,
  InsertCategory,
  Sale,
  InsertSale,
  StockMovement,
  InsertStockMovement,
} from "@shared/schema";
import * as usersImpl from "./impl/users.impl";
import * as categoriesImpl from "./impl/categories.impl";
import * as productsImpl from "./impl/products.impl";
import * as salesImpl from "./impl/sales.impl";
import * as stockImpl from "./impl/stock.impl";
import * as returnsImpl from "./impl/returns.impl";
import * as promotionsImpl from "./impl/promotions.impl";
import * as reportsImpl from "./impl/reports.impl";
import * as paymentsImpl from "./impl/payments.impl";
import * as ordersImpl from "./impl/orders.impl";
import * as couponsImpl from "./impl/coupons.impl";
import * as merchantImpl from "./impl/merchant.impl";
import * as customersImpl from "./impl/customers.impl";
import * as storesImpl from "./impl/stores.impl";

function getClient() {
  const sb = getSupabaseServer();
  if (!sb) {
    throw new Error(
      "Supabase not configured. Check SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return sb;
}

export class SupabaseStorage implements IStorage {
  private get client() {
    return getClient();
  }

  // Users
  getUser = (id: string) => usersImpl.getUser(this.client, id);
  getUserByUsername = (username: string) =>
    usersImpl.getUserByUsername(this.client, username);
  createUser = (user: InsertUser) => usersImpl.createUser(this.client, user);
  updateUser = (id: string, user: Partial<InsertUser>) =>
    usersImpl.updateUser(this.client, id, user);
  deleteUser = (id: string) => usersImpl.deleteUser(this.client, id);
  getUsers = () => usersImpl.getUsers(this.client);
  getUsersByStore = (storeId: string) => usersImpl.getUsersByStore(this.client, storeId);

  // Stores (merchant approval creates store)
  createStore = (payload: { name: string; ownerId: string }) =>
    storesImpl.createStore(this.client, payload);
  getStoreByOwnerId = (ownerId: string) =>
    storesImpl.getStoreByOwnerId(this.client, ownerId);
  getStores = () => storesImpl.getStores(this.client);
  getStoreById = (id: string) => storesImpl.getStoreById(this.client, id);

  // Categories
  getCategories = () => categoriesImpl.getCategories(this.client);
  getCategoriesForStore = (storeId?: string) =>
    categoriesImpl.getCategoriesForStore(this.client, storeId);
  createCategory = (category: InsertCategory) =>
    categoriesImpl.createCategory(this.client, category);
  updateCategory = (id: string, category: Partial<InsertCategory>) =>
    categoriesImpl.updateCategory(this.client, id, category);
  deleteCategory = (id: string) =>
    categoriesImpl.deleteCategory(this.client, id);

  // Products
  getProducts = (includeDeleted?: boolean) =>
    productsImpl.getProducts(this.client, includeDeleted);
  getProductsForStore = (storeId?: string, filters?: { categorySlug?: string; minPrice?: string; maxPrice?: string }) => productsImpl.getProductsForStore(this.client, storeId, filters);
  getProduct = (id: string) => productsImpl.getProduct(this.client, id);
  getProductBySku = (sku: string) =>
    productsImpl.getProductBySku(this.client, sku);
  getProductByBarcode = (barcode: string) =>
    productsImpl.getProductByBarcode(this.client, barcode);
  createProduct = (product: InsertProduct) =>
    productsImpl.createProduct(this.client, product);
  updateProduct = (id: string, product: Partial<InsertProduct>) =>
    productsImpl.updateProduct(this.client, id, product);

  // Image uploads (compress + store short path)
  uploadImage = (base64: string, storeId?: string | null) =>
    (async () => {
      const { uploadBase64Image } = await import("./impl/images.impl");
      return uploadBase64Image(this.client, base64, storeId);
    })();
  deleteProduct = (id: string) =>
    productsImpl.deleteProduct(this.client, id);
  softDeleteProduct = (id: string) =>
    productsImpl.softDeleteProduct(this.client, id);
  restoreProduct = (id: string) =>
    productsImpl.restoreProduct(this.client, id);
  updateStock = (id: string, quantity: number) =>
    productsImpl.updateStock(this.client, id, quantity);

  // Sales
  getSales = (includeDeleted?: boolean) =>
    salesImpl.getSales(this.client, includeDeleted ?? false);
  getSalesByUser = (userId: string, includeDeleted?: boolean) =>
    salesImpl.getSalesByUser(this.client, userId, includeDeleted ?? false);
  getSalesByCustomer = (customerId: string) =>
    salesImpl.getSalesByCustomer(this.client, customerId);
  getSalesToday = () => salesImpl.getSalesToday(this.client);
  createSale = (sale: InsertSale) => salesImpl.createSale(this.client, sale);
  softDeleteSale = (saleId: string) =>
    salesImpl.softDeleteSale(this.client, saleId);
  restoreSale = (saleId: string) =>
    salesImpl.restoreSale(this.client, saleId);
  deleteSale = (saleId: string) =>
    salesImpl.deleteSale(this.client, saleId);
  getSalesFiltered = (params: Parameters<typeof salesImpl.getSalesFiltered>[1]) =>
    salesImpl.getSalesFiltered(this.client, params);
  querySalesTable = () => salesImpl.querySalesTable(this.client);

  // Stock
  getStockMovements = () => stockImpl.getStockMovements(this.client);
  getStockMovementsByProduct = (productId: string) =>
    stockImpl.getStockMovementsByProduct(this.client, productId);
  createStockMovement = (movement: InsertStockMovement) =>
    stockImpl.createStockMovement(this.client, movement);

  // Returns
  createSaleItems = (
    saleId: string,
    items: Array<{
      productId: string;
      quantity: number;
      price: string;
      name: string;
      sku: string;
    }>
  ) => returnsImpl.createSaleItems(this.client, saleId, items);
  createSalesReturn = (
    params: Parameters<typeof returnsImpl.createSalesReturn>[1]
  ) => returnsImpl.createSalesReturn(this.client, params);

  // Promotions
  getPromotions = (storeId?: string) => promotionsImpl.getPromotions(this.client, storeId);
  createPromotion = (promo: any) =>
    promotionsImpl.createPromotion(this.client, promo);
  addPromotionTarget = (target: any) =>
    promotionsImpl.addPromotionTarget(this.client, target);
  getPromotionTargets = (storeId?: string) =>
    promotionsImpl.getPromotionTargets(this.client, storeId);

  // Reports
  getNotSellingProducts = (
    params: Parameters<typeof reportsImpl.getNotSellingProducts>[1]
  ) => reportsImpl.getNotSellingProducts(this.client, params);
  getStockValuation = () => reportsImpl.getStockValuation(this.client);
  getProfitMargins = (
    params: Parameters<typeof reportsImpl.getProfitMargins>[1]
  ) => reportsImpl.getProfitMargins(this.client, params);

  // Payments
  createPayment = (payment: any) =>
    paymentsImpl.createPayment(this.client, payment);
  updatePayment = (id: string, data: any) =>
    paymentsImpl.updatePayment(this.client, id, data);

  // Orders (online)
  getOrders = (includeProcessed?: boolean) =>
    ordersImpl.getOrders(this.client, includeProcessed ?? false);
  getOrderById = (id: string) => ordersImpl.getOrderById(this.client, id);
  getOrdersByStore = (storeId: string) =>
    ordersImpl.getOrdersByStore(this.client, storeId);
  getOrdersByCustomer = (customerId: string) =>
    ordersImpl.getOrdersByCustomer(this.client, customerId);
  createOrder = (order: any) => ordersImpl.createOrder(this.client, order);
  updateOrderStatus = (id: string, status: string, processedBy?: string) =>
    ordersImpl.updateOrderStatus(this.client, id, status, processedBy);

  // Coupons
  getDiscountCoupons = (storeId?: string) => couponsImpl.getDiscountCoupons(this.client, storeId);
  createDiscountCoupon = (coupon: any) =>
    couponsImpl.createDiscountCoupon(this.client, coupon);
  getDiscountCouponByName = (name: string) =>
    couponsImpl.getDiscountCouponByName(this.client, name);
  updateDiscountCoupon = (id: string, coupon: any) =>
    couponsImpl.updateDiscountCoupon(this.client, id, coupon);
  deleteDiscountCoupon = (id: string) =>
    couponsImpl.deleteDiscountCoupon(this.client, id);

  // Merchant requests (Super Admin governance)
  getMerchantRequests = (status?: "pending" | "approved" | "rejected") =>
    merchantImpl.getMerchantRequests(this.client, status);
  createMerchantRequest = (data: import("@shared/schema").InsertMerchantRequest) =>
    merchantImpl.createMerchantRequest(this.client, data);
  updateMerchantRequest = (
    id: string,
    data: { status: string; reviewedBy?: string }
  ) => merchantImpl.updateMerchantRequest(this.client, id, data);

  // Customers (POS & user-linked customer profiles)
  getCustomerByUser = (userId: string) => customersImpl.getCustomerByUser(this.client, userId);
  createCustomer = (data: import("@shared/schema").InsertCustomer & { userId?: string }) => customersImpl.createCustomer(this.client, data);
}
