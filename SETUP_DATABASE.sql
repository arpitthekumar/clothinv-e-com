-- ===========================================================================
-- CLOTHINV - Complete Database Schema Setup
-- ===========================================================================
-- This is the ONLY SQL file needed to setup the entire database
-- Run this in Supabase SQL editor to initialize all tables
-- ===========================================================================

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
  role TEXT NOT NULL DEFAULT 'employee', -- super_admin | admin | employee | customer
  full_name TEXT NOT NULL,
  store_id VARCHAR(36) REFERENCES stores(id), -- admin/employee: their store; super_admin/customer: NULL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 2. CATEGORIES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'white',
  visibility TEXT NOT NULL DEFAULT 'offline', -- online | offline
  approval_status TEXT NOT NULL DEFAULT 'approved', -- pending | approved | rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 3. PRODUCTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id VARCHAR(36) REFERENCES categories(id), -- primary/legacy category
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  buying_price DECIMAL(10, 2),
  size TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  barcode TEXT,
  image TEXT, -- base64 or URL; main product image
  visibility TEXT NOT NULL DEFAULT 'offline', -- online | offline | both
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  invoice_number TEXT NOT NULL UNIQUE,
  order_source TEXT NOT NULL DEFAULT 'pos', -- pos | online
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'percent' | 'fixed'
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
  target_type TEXT NOT NULL, -- 'product' | 'category'
  target_id VARCHAR(36) NOT NULL
);

-- ============================
-- 16. DISCOUNT COUPONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS discount_coupons (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
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
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  provider TEXT NOT NULL, -- 'razorpay'
  order_id TEXT,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'created', -- created | authorized | captured | failed | refunded
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

-- Categories
CREATE INDEX idx_categories_name ON categories(name);

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_deleted ON products(deleted);

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
-- ROW LEVEL SECURITY (Optional but recommended for Supabase)
-- ===========================================================================
-- Enable RLS on all tables (uncomment if needed)
/*
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
ALTER TABLE merchant_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_cost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
*/

-- ===========================================================================
-- DONE! All tables are ready to use.
-- ===========================================================================
