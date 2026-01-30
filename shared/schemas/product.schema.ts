import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { categories } from "./category.schema";

/** Product visibility: online = store only, offline = POS only, both = both. */
export const PRODUCT_VISIBILITY = ["online", "offline", "both"] as const;

export const products = pgTable("products", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  categoryId: varchar("category_id").references(() => categories.id),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  buyingPrice: decimal("buying_price", { precision: 10, scale: 2 }),
  size: text("size"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").default(5),
  barcode: text("barcode"),
  image: text("image"), // base64 or URL
  visibility: text("visibility").notNull().default("offline"),
  deleted: boolean("deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  sku: true,
  categoryId: true,
  description: true,
  price: true,
  buyingPrice: true,
  size: true,
  stock: true,
  minStock: true,
  barcode: true,
  image: true,
  visibility: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
