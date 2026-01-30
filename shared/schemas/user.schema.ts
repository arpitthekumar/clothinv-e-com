import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** Roles: super_admin (platform), admin (merchant), employee (POS), customer (e-commerce buyer) */
export const USER_ROLES = ["super_admin", "admin", "employee", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  authUid: text("auth_uid").unique(), // optional: map to Supabase auth.uid()
  role: text("role").notNull().default("employee"),
  fullName: text("full_name").notNull(),
  storeId: varchar("store_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  authUid: true,
  role: true,
  fullName: true,
  storeId: true,
}).extend({
  role: z.enum(USER_ROLES as any),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
