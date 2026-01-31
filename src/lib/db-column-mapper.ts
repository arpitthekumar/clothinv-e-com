/**
 * Maps frontend camelCase field names to database column names.
 * Supabase/Postgres tables use snake_case. This helper converts between
 * the app's camelCase model and DB column names.
 */

export function mapProductToDb(product: any): any {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const db: any = {};

  // Direct passthrough (already snake_case or same name)
  for (const key of [
    "id",
    "name",
    "slug",
    "sku",
    "description",
    "price",
    "size",
    "stock",
    "barcode",
    "image",
    "visibility",
    "deleted",
  ]) {
    if (product[key] !== undefined) db[key] = product[key];
  }

  // camelCase -> snake_case
  if (product.storeId !== undefined) db.store_id = product.storeId;
  if (product.categoryId !== undefined) db.category_id = product.categoryId;
  if (product.minStock !== undefined) db.min_stock = product.minStock;

  if (product.buyingPrice !== undefined && product.buyingPrice !== null && product.buyingPrice !== "") {
    db.buying_price = product.buyingPrice;
  }

  // timestamps
  if (product.createdAt !== undefined) db.created_at = product.createdAt;
  if (product.updatedAt !== undefined) db.updated_at = product.updatedAt;
  if (product.deletedAt !== undefined) db.deleted_at = product.deletedAt;

  return db;
}

export function mapProductFromDb(product: any): any {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const mapped: any = { ...product };

  if ('store_id' in mapped && mapped.store_id !== undefined) {
    mapped.storeId = mapped.store_id;
    delete mapped.store_id;
  }

  if ('category_id' in mapped && mapped.category_id !== undefined) {
    mapped.categoryId = mapped.category_id;
    delete mapped.category_id;
  }

  if ('min_stock' in mapped && mapped.min_stock !== undefined) {
    mapped.minStock = mapped.min_stock;
    delete mapped.min_stock;
  }

  if ('buying_price' in mapped && mapped.buying_price !== undefined) {
    mapped.buyingPrice = mapped.buying_price;
    delete mapped.buying_price;
  }

  if ('created_at' in mapped && mapped.created_at !== undefined) {
    mapped.createdAt = mapped.created_at;
    delete mapped.created_at;
  }

  if ('updated_at' in mapped && mapped.updated_at !== undefined) {
    mapped.updatedAt = mapped.updated_at;
    delete mapped.updated_at;
  }

  if ('deleted_at' in mapped && mapped.deleted_at !== undefined) {
    mapped.deletedAt = mapped.deleted_at;
    delete mapped.deleted_at;
  }

  return mapped;
}

