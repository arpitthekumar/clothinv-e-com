import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./user.schema";

/** Merchant onboarding requests. Super Admin approves → user becomes admin (merchant). */
export const merchantRequests = pgTable("merchant_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  shopName: text("shop_name").notNull(),
  address: text("address"),
  businessDetails: text("business_details"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMerchantRequestSchema = z.object({
  userId: z.string().min(1),
  shopName: z.string().min(1),
  address: z.string().optional(),
  businessDetails: z.string().optional(),
});

export type MerchantRequest = typeof merchantRequests.$inferSelect;
export type InsertMerchantRequest = z.infer<typeof insertMerchantRequestSchema>;
