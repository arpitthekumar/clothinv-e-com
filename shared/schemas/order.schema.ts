import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { products } from "./product.schema";
import { customers } from "./pos.schema";
import { stores } from "./store.schema";

/** Order source: pos = in-store, online = e-commerce checkout. */
export const ORDER_SOURCE = ["pos", "online"] as const;
export const ORDER_STATUS = ["created", "packed", "shipped", "delivered", "cancelled"] as const;

export const sales = pgTable("sales", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  user_id: varchar("user_id").notNull(),
  customer_id: varchar("customer_id"),
  customer_name: text("customer_name").notNull(),
  customer_phone: text("customer_phone").notNull(),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal").notNull(),
  tax_percent: decimal("tax_percent").notNull().default("0"),
  tax_amount: decimal("tax_amount").notNull().default("0"),
  discount_type: text("discount_type"),
  discount_value: decimal("discount_value").notNull().default("0"),
  discount_amount: decimal("discount_amount").notNull().default("0"),
  total_amount: decimal("total_amount").notNull(),
  payment_method: text("payment_method").notNull().default("cash"),
  invoice_number: text("invoice_number").notNull(),
  order_source: text("order_source").notNull().default("pos"),
  deleted: boolean("deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders (online checkout)
export const orders = pgTable("orders", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  customer_id: varchar("customer_id"),
  customer_name: text("customer_name").notNull(),
  customer_phone: text("customer_phone").notNull(),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal").notNull(),
  tax_percent: decimal("tax_percent").notNull().default("0"),
  tax_amount: decimal("tax_amount").notNull().default("0"),
  discount_type: text("discount_type"),
  discount_value: decimal("discount_value").notNull().default("0"),
  discount_amount: decimal("discount_amount").notNull().default("0"),
  total_amount: decimal("total_amount").notNull(),
  payment_method: text("payment_method").notNull().default("online"),
  payment_provider: text("payment_provider"),
  payment_status: text("payment_status").notNull().default("pending"),
  status: text("status").notNull().default("created"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  storeId: true,
  customer_id: true,
  customer_name: true,
  customer_phone: true,
  items: true,
  subtotal: true,
  tax_percent: true,
  tax_amount: true,
  discount_type: true,
  discount_value: true,
  discount_amount: true,
  total_amount: true,
  payment_method: true,
  payment_provider: true,
  payment_status: true,
  status: true,
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const insertSaleSchema = createInsertSchema(sales).pick({
  user_id: true,
  customer_id: true,
  customer_name: true,
  customer_phone: true,
  items: true,
  invoice_number: true,
  subtotal: true,
  tax_percent: true,
  tax_amount: true,
  discount_type: true,
  discount_value: true,
  discount_amount: true,
  total_amount: true,
  payment_method: true,
  order_source: true,
});

export type Sale = {
  id: string;
  user_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  items: any;
  subtotal: string;
  tax_percent: string;
  tax_amount: string;
  discount_type?: string | null;
  discount_value: string;
  discount_amount: string;
  total_amount: string;
  payment_method: string;
  invoice_number: string;
  order_source?: string;
  deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date | null;
};

export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = {
  productId: string;
  quantity: number;
  price: string;
  name: string;
  sku: string;
};

// Sale items (normalized)
export const saleItems = pgTable("sale_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id")
    .references(() => sales.id)
    .notNull(),
  productId: varchar("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  price: true,
  name: true,
  sku: true,
});

export type SaleItemRow = typeof saleItems.$inferSelect;
export type InsertSaleItemRow = z.infer<typeof insertSaleItemSchema>;

// Sales returns
export const salesReturns = pgTable("sales_returns", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id")
    .references(() => sales.id)
    .notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesReturnItems = pgTable("sales_return_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  salesReturnId: varchar("sales_return_id")
    .references(() => salesReturns.id)
    .notNull(),
  saleItemId: varchar("sale_item_id").references(() => saleItems.id),
  productId: varchar("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalesReturnSchema = createInsertSchema(salesReturns).pick({
  saleId: true,
  customerId: true,
  reason: true,
});

export const insertSalesReturnItemSchema = createInsertSchema(
  salesReturnItems
).pick({
  salesReturnId: true,
  saleItemId: true,
  productId: true,
  quantity: true,
  refundAmount: true,
});

export type SalesReturn = typeof salesReturns.$inferSelect;
export type InsertSalesReturn = z.infer<typeof insertSalesReturnSchema>;
export type SalesReturnItem = typeof salesReturnItems.$inferSelect;
export type InsertSalesReturnItem = z.infer<typeof insertSalesReturnItemSchema>;

// Payments
export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").references(() => sales.id),
  orderId: varchar("order_id").references(() => orders.id),
  storeId: varchar("store_id").references(() => stores.id),
  provider: text("provider").notNull(),
  order_provider_id: text("order_id_provider"),
  paymentId: text("payment_id"),
  status: text("status").notNull().default("created"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  saleId: true,
  orderId: true,
  storeId: true,
  provider: true,
  order_provider_id: true,
  paymentId: true,
  status: true,
  amount: true,
  method: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  saleId: true,
  provider: true,
  orderId: true,
  paymentId: true,
  status: true,
  amount: true,
  method: true,
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
