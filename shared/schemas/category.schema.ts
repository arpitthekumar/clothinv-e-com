import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { stores } from "./store.schema";

/** Visibility: where category appears. Approval: only approved + online show on store. */
export const CATEGORY_VISIBILITY = ["online", "offline"] as const;
export const CATEGORY_APPROVAL_STATUS = ["pending", "approved", "rejected"] as const;

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey(),
  storeId: varchar("store_id").references(() => stores.id), // NULL = platform-wide category
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  color: text("color").notNull().default("white"),
  visibility: text("visibility").notNull().default("offline"),
  approvalStatus: text("approval_status").notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = z.object({
  storeId: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().min(1),
  visibility: z.enum(CATEGORY_VISIBILITY).optional(),
  approvalStatus: z.enum(CATEGORY_APPROVAL_STATUS).optional(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
