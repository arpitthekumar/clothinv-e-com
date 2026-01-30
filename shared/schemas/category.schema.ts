import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

/** Visibility: where category appears. Approval: only approved + online show on store. */
export const CATEGORY_VISIBILITY = ["online", "offline"] as const;
export const CATEGORY_APPROVAL_STATUS = ["pending", "approved", "rejected"] as const;

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("white"),
  visibility: text("visibility").notNull().default("offline"),
  approvalStatus: text("approval_status").notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().min(1),
  visibility: z.enum(CATEGORY_VISIBILITY).optional(),
  approvalStatus: z.enum(CATEGORY_APPROVAL_STATUS).optional(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
