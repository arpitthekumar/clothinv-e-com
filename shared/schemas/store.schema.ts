import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";

/** One store per approved merchant (admin). */
export const stores = pgTable("stores", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().unique(),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postcode: text("postcode"),
  country: text("country"),
  latitude: varchar("latitude"),
  longitude: varchar("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Store = typeof stores.$inferSelect;
