import { pgTable, varchar } from "drizzle-orm/pg-core";
import { products } from "./product.schema";
import { categories } from "./category.schema";

/** Many-to-many: product can have multiple categories, category can have multiple products. */
export const productCategories = pgTable(
  "product_categories",
  {
    productId: varchar("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: varchar("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [{ primaryKey: { columns: [t.productId, t.categoryId] } }]
);
