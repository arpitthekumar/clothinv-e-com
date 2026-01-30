import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";

/** One store per approved merchant (admin). */
export const stores = pgTable("stores", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Store = typeof stores.$inferSelect;
