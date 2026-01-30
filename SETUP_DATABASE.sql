-- ===========================================================================
-- CLOTHINV - Complete Database Schema Setup
-- ===========================================================================
-- This is the ONLY SQL file needed to setup the entire database
-- Run this in Supabase SQL editor to initialize all tables
-- ===========================================================================

-- ============================
-- ENUM / TYPE DEFINITIONS
-- ============================
CREATE TYPE user_role AS ENUM ('super_admin','admin','employee','customer');
CREATE TYPE visibility_enum AS ENUM ('online','offline','both');
CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');
CREATE TYPE order_source_enum AS ENUM ('pos','online');
CREATE TYPE order_status_enum AS ENUM ('created','packed','shipped','delivered','cancelled');
CREATE TYPE payment_status_enum AS ENUM ('created','authorized','captured','failed','refunded');
CREATE TYPE order_payment_status AS ENUM ('pending','paid','failed','refunded');


-- ============================
-- 0. STORES TABLE (merchant/store — one per approved merchant)
-- ============================
CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  owner_id VARCHAR(36) NOT NULL UNIQUE, -- admin user id (one store per merchant)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 1. USERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  auth_uid TEXT UNIQUE, -- optional: map to Supabase auth.uid() for safe RLS mapping
  role user_role NOT NULL DEFAULT 'employee'::user_role,
  full_name TEXT NOT NULL,
  store_id VARCHAR(36) REFERENCES stores(id), -- admin/employee: their store; super_admin/customer: NULL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 2. CATEGORIES TABLE (store-scoped)
-- ============================
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  store_id VARCHAR(36) REFERENCES stores(id), -- NULL = platform-wide category
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'white',
  visibility visibility_enum NOT NULL DEFAULT 'offline'::visibility_enum, -- online | offline
  approval_status approval_status NOT NULL DEFAULT 'approved'::approval_status, -- pending | approved | rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_unique_per_store UNIQUE (store_id, slug)
);

-- ============================
-- 3. PRODUCTS TABLE (store-scoped)
-- ============================
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  store_id VARCHAR(36) REFERENCES stores(id), -- product belongs to a store
  name TEXT NOT NULL,
  slug TEXT,
  sku TEXT NOT NULL,
  category_id VARCHAR(36) REFERENCES categories(id), -- primary/legacy category
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  buying_price DECIMAL(10, 2),
  size TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  barcode TEXT,
  image TEXT, -- base64 or URL; main product image
  visibility visibility_enum NOT NULL DEFAULT 'offline'::visibility_enum, -- online | offline | both
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT products_sku_store_unique UNIQUE (sku, store_id)
);

-- ============================
-- 3b. PRODUCT_CATEGORIES (many-to-many: product can have multiple categories)
-- ============================
CREATE TABLE IF NOT EXISTS product_categories (
  product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id VARCHAR(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- ============================
-- 4. CUSTOMERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 5. SALES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  store_id VARCHAR(36) REFERENCES stores(id), -- which store this sale belongs to (POS or derived from order)
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  customer_id VARCHAR(36),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL, -- Array of {productId, quantity, price}
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_percent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_type TEXT, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  invoice_number TEXT NOT NULL,
  order_source order_source_enum NOT NULL DEFAULT 'pos'::order_source_enum, -- pos | online
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sales_invoice_store_unique UNIQUE (invoice_number, store_id)
);

-- ============================
-- ORDERS TABLE (Online e-commerce orders lifecycle)
-- ============================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  store_id VARCHAR(36) REFERENCES stores(id) NOT NULL,
  customer_id VARCHAR(36), -- user id if customer is logged in
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL, -- Array of {productId, quantity, price}
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_percent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_type TEXT,
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'online',
  payment_provider TEXT,
  payment_status order_payment_status NOT NULL DEFAULT 'pending'::order_payment_status,
  status order_status_enum NOT NULL DEFAULT 'created'::order_status_enum, -- created | packed | shipped | delivered | cancelled
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 6. SALE ITEMS TABLE (Normalized)
-- ============================
CREATE TABLE IF NOT EXISTS sale_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  name TEXT NOT NULL, -- snapshot
  sku TEXT NOT NULL, -- snapshot
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 7. SALES RETURNS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sales_returns (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  customer_id VARCHAR(36) REFERENCES customers(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 8. SALES RETURN ITEMS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sales_return_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sales_return_id VARCHAR(36) NOT NULL REFERENCES sales_returns(id),
  sale_item_id VARCHAR(36) REFERENCES sale_items(id),
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  refund_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 9. STOCK MOVEMENTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'po_receipt' | 'sale_out' | 'return_in' | 'damage_out' | 'manual_adjust'
  quantity INTEGER NOT NULL,
  reason TEXT,
  ref_table TEXT, -- e.g., 'purchase_order_items', 'sale_items', 'sales_return_items'
  ref_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 10. SYNC STATUS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sync_status (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  table_name TEXT NOT NULL,
  last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pending_changes INTEGER DEFAULT 0
);

-- ============================
-- 11. MERCHANT REQUESTS (onboarding)
-- ============================
CREATE TABLE IF NOT EXISTS merchant_requests (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id VARCHAR(36) NOT NULL,
  shop_name TEXT NOT NULL,
  address TEXT,
  business_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewed_by VARCHAR(36),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 12. PRODUCT COST HISTORY TABLE
-- ============================
CREATE TABLE IF NOT EXISTS product_cost_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  cost DECIMAL(10, 2) NOT NULL,
  source TEXT NOT NULL, -- 'PO' | 'manual'
  effective_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 13. PRODUCT PRICE HISTORY TABLE
-- ============================
CREATE TABLE IF NOT EXISTS product_price_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id),
  price DECIMAL(10, 2) NOT NULL,
  effective_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 14. PROMOTIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  store_id VARCHAR(36) REFERENCES stores(id), -- NULL = platform-wide promotion
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percent','fixed')), -- 'percent' | 'fixed'
  value DECIMAL(10, 2) NOT NULL,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 15. PROMOTION TARGETS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS promotion_targets (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  promotion_id VARCHAR(36) NOT NULL REFERENCES promotions(id),
  store_id VARCHAR(36) REFERENCES stores(id), -- optional, inherited from promotion
  target_type TEXT NOT NULL CHECK (target_type IN ('product','category')), -- 'product' | 'category'
  target_id VARCHAR(36) NOT NULL
);

-- ============================
-- 16. DISCOUNT COUPONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS discount_coupons (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  store_id VARCHAR(36) REFERENCES stores(id), -- NULL = platform-wide coupon
  name TEXT NOT NULL UNIQUE,
  percentage DECIMAL(5, 2) NOT NULL, -- e.g., 10.00 for 10%
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36) NOT NULL REFERENCES users(id)
);

-- ============================
-- 17. PAYMENTS TABLE (Razorpay, etc.)
-- ============================
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sale_id VARCHAR(36) REFERENCES sales(id),
  order_id VARCHAR(36) REFERENCES orders(id), -- payments can be for orders (online) or sales (POS)
  store_id VARCHAR(36) REFERENCES stores(id),
  provider TEXT NOT NULL, -- 'razorpay'
  order_provider_id TEXT,
  payment_id TEXT,
  status payment_status_enum NOT NULL DEFAULT 'created'::payment_status_enum, -- created | authorized | captured | failed | refunded
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT, -- UPI | card | netbanking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- INDEXES FOR PERFORMANCE
-- ===========================================================================

-- Stores
CREATE INDEX idx_stores_owner_id ON stores(owner_id);

-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_users_auth_uid ON users(auth_uid);

-- Categories
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_store_id ON categories(store_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_sku_store ON products(sku, store_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_deleted ON products(deleted);

-- Sales & Orders
CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Payments
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_store_id ON payments(store_id);
-- Product categories (many-to-many)
CREATE INDEX idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX idx_product_categories_category_id ON product_categories(category_id);

-- Sales
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_deleted ON sales(deleted);

-- Sale Items
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Sales Returns
CREATE INDEX idx_sales_returns_sale_id ON sales_returns(sale_id);
CREATE INDEX idx_sales_returns_customer_id ON sales_returns(customer_id);

-- Stock Movements
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);

-- Merchant Requests
CREATE INDEX idx_merchant_requests_user_id ON merchant_requests(user_id);
CREATE INDEX idx_merchant_requests_status ON merchant_requests(status);

-- Cost & Price History
CREATE INDEX idx_cost_history_product_id ON product_cost_history(product_id);
CREATE INDEX idx_price_history_product_id ON product_price_history(product_id);

-- Promotions
CREATE INDEX idx_promotion_targets_promotion_id ON promotion_targets(promotion_id);

-- Discount Coupons
CREATE INDEX idx_coupons_name ON discount_coupons(name);
CREATE INDEX idx_coupons_active ON discount_coupons(active);

-- Payments
CREATE INDEX idx_payments_sale_id ON payments(sale_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ===========================================================================
-- ROW LEVEL SECURITY (RECOMMENDED FOR SUPABASE)
-- ===========================================================================
-- Enable RLS and create policies to enforce per-store ownership and access.
-- Public (unauthenticated) users may SELECT records marked for public viewing
-- (e.g., `products.visibility = 'online'`). Only store staff (admin/employee)
-- for a store or `super_admin` can create/update/delete resources for that store.

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_status_super_admin_only" ON sync_status
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

ALTER TABLE merchant_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_cost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- Promotions: public select for active promotions (and time-window checks)
CREATE POLICY "public_select_active_promotions" ON promotions
  FOR SELECT USING (
    active = TRUE AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY "manage_promotions_store_staff_or_super" ON promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = promotions.store_id)))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = promotions.store_id)))
  );

-- Promotion targets: visible when parent promotion is active or to store staff
CREATE POLICY "select_promotion_targets_public_or_store" ON promotion_targets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM promotions p WHERE p.id = promotion_targets.promotion_id AND p.active = TRUE)
    OR EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND (promotion_targets.store_id IS NULL OR u.store_id = promotion_targets.store_id))))
  );

CREATE POLICY "manage_promotion_targets_store_staff_or_super" ON promotion_targets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = promotion_targets.store_id)))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = promotion_targets.store_id)))
  );

-- Coupons: public select for active coupons; management by store staff or super_admin
CREATE POLICY "public_select_active_coupons" ON discount_coupons
  FOR SELECT USING (active = TRUE);

CREATE POLICY "manage_coupons_store_staff_or_super" ON discount_coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = discount_coupons.store_id)))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = discount_coupons.store_id)))
  );
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Note: policies prefer `users.auth_uid` to map to Supabase auth.uid(). Set
-- users.auth_uid to auth.uid() at registration/linking. For backward compatibility,
-- several policies also fall back to checking `users.id = auth.uid()` when present.

-- ==================== Products ====================
CREATE POLICY "public_select_online_products" ON products
  FOR SELECT USING (visibility = 'online' AND (deleted IS FALSE OR deleted IS NULL));

CREATE POLICY "select_products_store_staff_or_super" ON products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR (u.store_id = products.store_id AND (u.role IN ('admin','employee')))))
  );

CREATE POLICY "insert_products_store_admin_or_super" ON products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = products.store_id)))
  );

CREATE POLICY "update_products_store_staff_or_super" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR (u.store_id = products.store_id AND (u.role IN ('admin','employee')))))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR (u.store_id = products.store_id AND (u.role IN ('admin','employee')))))
  );

CREATE POLICY "delete_products_store_admin_or_super" ON products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = products.store_id)))
  );

-- ==================== Categories ====================
CREATE POLICY "public_select_online_categories" ON categories
  FOR SELECT USING (visibility = 'online');

CREATE POLICY "select_categories_store_staff_or_super" ON categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (
      u.role = 'super_admin' OR (
        (u.role IN ('admin','employee')) AND (categories.store_id IS NULL OR u.store_id = categories.store_id)
      )
    ))
  );

CREATE POLICY "insert_categories_store_admin_or_super" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (
      u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = categories.store_id)
    ))
  );

CREATE POLICY "update_categories_store_admin_or_super" ON categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (
      u.role = 'super_admin' OR (u.store_id = categories.store_id AND (u.role IN ('admin','employee')))
    ))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (
      u.role = 'super_admin' OR (u.store_id = categories.store_id AND (u.role IN ('admin','employee')))
    ))
  );

CREATE POLICY "delete_categories_store_admin_or_super" ON categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (
      u.role = 'super_admin' OR (u.store_id = categories.store_id AND (u.role IN ('admin','employee')))
    ))
  );

-- ==================== Orders ====================
CREATE POLICY "insert_orders_customers_or_staff" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      (EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND u.role = 'customer' AND orders.customer_id = auth.uid())) OR
      (EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND ((u.role IN ('admin','employee')) AND u.store_id = orders.store_id))) OR
      (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'))
    )
  );

CREATE POLICY "select_orders_customer_store_staff_or_super" ON orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      orders.customer_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR (u.store_id = orders.store_id AND (u.role IN ('admin','employee')))))
    )
  );

CREATE POLICY "update_orders_status_store_staff_or_super" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.role = 'super_admin' OR (u.store_id = orders.store_id AND u.role IN ('admin','employee'))))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.role = 'super_admin' OR (u.store_id = orders.store_id AND u.role IN ('admin','employee'))))
  );

-- customers_update_self_orders_only removed: customers must NOT be allowed to update or delete orders via RLS; only store staff (status changes) and super_admin may modify orders.

CREATE POLICY "delete_orders_super_admin_only" ON orders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- ==================== Sales (POS) ====================
CREATE POLICY "insert_sales_store_staff_or_super" ON sales
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.role = 'super_admin' OR (u.role IN ('admin','employee') AND u.store_id = sales.store_id)))
  );

CREATE POLICY "select_sales_customer_store_staff_or_super" ON sales
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      (sales.customer_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR (u.store_id = sales.store_id AND (u.role IN ('admin','employee')))))
    ) AND (sales.deleted IS FALSE OR sales.deleted IS NULL)
  );

CREATE POLICY "modify_sales_store_admin_or_super" ON sales
  FOR UPDATE, DELETE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.role = 'super_admin' OR ((u.role IN ('admin','employee')) AND u.store_id = sales.store_id)))
  );

-- ==================== Payments ====================
CREATE POLICY "payments_insert_store_staff_or_super" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR (u.role IN ('admin','employee') AND u.store_id = payments.store_id)))
  );

CREATE POLICY "payments_select_store_staff_or_super_or_owner" ON payments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (SELECT 1 FROM users u WHERE (u.auth_uid = auth.uid() OR u.id = auth.uid()) AND (u.role = 'super_admin' OR (u.store_id = payments.store_id AND (u.role IN ('admin','employee')))))
      OR EXISTS (SELECT 1 FROM orders o WHERE o.id = payments.order_id AND o.customer_id = auth.uid())
      OR EXISTS (SELECT 1 FROM sales s WHERE s.id = payments.sale_id AND s.customer_id = auth.uid())
    )
  );

-- ===========================================================================
-- MIGRATION NOTES
-- ===========================================================================
-- 1) This update introduces `store_id` and `slug` for categories/products and a
--    new `orders` table for the online order lifecycle. These fields ensure
--    clear separation of data between stores and avoid collisions (e.g., SKU)
--    across different stores.
--
-- 2) For existing deployments: backfill `store_id` and `slug` values. Example
--    strategy:
--      - If single-store deployment: set store_id to the only store's id for
--        existing products/categories.
--      - Generate `slug` from name (slugify) and ensure uniqueness per store.
--      - Add an admin script to reconcile ambiguous mappings.
--
-- 3) Indexes and constraints were added for `store_id`, `slug`, and composite
--    uniqueness of (sku, store_id) and (invoice_number, store_id) for safer
--    multi-store behaviour.
--
-- 4) Consider enabling Row Level Security and adding policies that enforce
--    `store_id` filtering on authenticated requests (recommended for Supabase).
--
-- ===========================================================================
-- DONE! All tables are ready to use.
-- ===========================================================================
