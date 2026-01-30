import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { products } from "./product.schema";
import { users } from "./user.schema";

export const stockMovements = pgTable("stock_movements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: varchar("product_id")
    .references(() => products.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  refTable: text("ref_table"),
  refId: varchar("ref_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const syncStatus = pgTable("sync_status", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tableName: text("table_name").notNull(),
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  pendingChanges: integer("pending_changes").default(0),
});

export const productCostHistory = pgTable("product_cost_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: varchar("product_id")
    .references(() => products.id)
    .notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull(),
  effectiveAt: timestamp("effective_at").defaultNow(),
});

export const productPriceHistory = pgTable("product_price_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: varchar("product_id")
    .references(() => products.id)
    .notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  effectiveAt: timestamp("effective_at").defaultNow(),
});

export const insertStockMovementSchema = createInsertSchema(
  stockMovements
).pick({
  productId: true,
  userId: true,
  type: true,
  quantity: true,
  reason: true,
});

export const insertProductCostSchema = createInsertSchema(
  productCostHistory
).pick({
  productId: true,
  cost: true,
  source: true,
  effectiveAt: true,
});

export const insertProductPriceSchema = createInsertSchema(
  productPriceHistory
).pick({
  productId: true,
  price: true,
  effectiveAt: true,
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type SyncStatus = typeof syncStatus.$inferSelect;
export type ProductCost = typeof productCostHistory.$inferSelect;
export type InsertProductCost = z.infer<typeof insertProductCostSchema>;
export type ProductPrice = typeof productPriceHistory.$inferSelect;
export type InsertProductPrice = z.infer<typeof insertProductPriceSchema>;
