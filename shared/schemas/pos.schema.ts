import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  decimal,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./user.schema";

export const customers = pgTable("customers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountCoupons = pgTable("discount_coupons", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
});

export const promotions = pgTable("promotions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotionTargets = pgTable("promotion_targets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  promotionId: varchar("promotion_id")
    .references(() => promotions.id)
    .notNull(),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  phone: true,
  email: true,
});

export const insertDiscountCouponSchema = createInsertSchema(
  discountCoupons
).pick({
  name: true,
  percentage: true,
  active: true,
  createdBy: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).pick({
  name: true,
  type: true,
  value: true,
  startsAt: true,
  endsAt: true,
  active: true,
});

export const insertPromotionTargetSchema = createInsertSchema(
  promotionTargets
).pick({
  promotionId: true,
  targetType: true,
  targetId: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type DiscountCoupon = typeof discountCoupons.$inferSelect;
export type InsertDiscountCoupon = z.infer<typeof insertDiscountCouponSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type PromotionTarget = typeof promotionTargets.$inferSelect;
export type InsertPromotionTarget = z.infer<typeof insertPromotionTargetSchema>;
