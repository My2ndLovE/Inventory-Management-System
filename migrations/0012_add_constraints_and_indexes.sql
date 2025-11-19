-- Migration: Add database constraints and performance indexes
-- This migration adds CHECK constraints for data integrity and composite indexes for performance

-- ============================================================================
-- ADD CHECK CONSTRAINTS
-- ============================================================================

-- Products: Ensure prices are valid
-- Note: SQLite doesn't support adding constraints to existing tables via ALTER TABLE
-- So we create new tables and copy data

-- 1. Products constraints
CREATE TABLE products_new (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  category_id TEXT,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  barcode TEXT,
  cost_price REAL NOT NULL CHECK (cost_price >= 0),
  selling_price REAL NOT NULL CHECK (selling_price >= 0),
  min_stock_level INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
  is_active BOOLEAN NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations (id),
  FOREIGN KEY (category_id) REFERENCES categories (id),
  CHECK (updated_at >= created_at),
  UNIQUE (organization_id, sku)
);

-- Copy data from old table
INSERT INTO products_new SELECT * FROM products;

-- Drop old table and rename new one
DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

-- 2. Stock constraints
CREATE TABLE stock_new (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  last_counted_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations (id),
  FOREIGN KEY (product_id) REFERENCES products (id),
  FOREIGN KEY (location_id) REFERENCES locations (id),
  CHECK (reserved_quantity <= quantity),
  CHECK (updated_at >= created_at),
  UNIQUE (product_id, variant_id, location_id)
);

-- Copy data from old table
INSERT INTO stock_new SELECT * FROM stock;

-- Drop old table and rename new one
DROP TABLE stock;
ALTER TABLE stock_new RENAME TO stock;

-- 3. Sales constraints
CREATE TABLE sales_new (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  sale_number TEXT NOT NULL,
  location_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  subtotal REAL NOT NULL CHECK (subtotal >= 0),
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations (id),
  FOREIGN KEY (location_id) REFERENCES locations (id),
  CHECK (discount_amount <= subtotal),
  CHECK (total_amount = subtotal - discount_amount + tax_amount),
  CHECK (updated_at >= created_at),
  UNIQUE (organization_id, sale_number)
);

-- Copy data from old table
INSERT INTO sales_new SELECT * FROM sales;

-- Drop old table and rename new one
DROP TABLE sales;
ALTER TABLE sales_new RENAME TO sales;

-- 4. Sale Items constraints
CREATE TABLE sale_items_new (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  cost_price REAL NOT NULL CHECK (cost_price >= 0),
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Copy data from old table
INSERT INTO sale_items_new SELECT * FROM sale_items;

-- Drop old table and rename new one
DROP TABLE sale_items;
ALTER TABLE sale_items_new RENAME TO sale_items;

-- 5. Inventory Movements constraints
CREATE TABLE inventory_movements_new (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'SALE', 'RETURN')),
  quantity INTEGER NOT NULL CHECK (quantity != 0),
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations (id),
  FOREIGN KEY (product_id) REFERENCES products (id),
  FOREIGN KEY (location_id) REFERENCES locations (id)
);

-- Copy data from old table
INSERT INTO inventory_movements_new SELECT * FROM inventory_movements;

-- Drop old table and rename new one
DROP TABLE inventory_movements;
ALTER TABLE inventory_movements_new RENAME TO inventory_movements;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Products indexes
CREATE INDEX idx_products_org_active ON products(organization_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_org_category ON products(organization_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_products_name_search ON products(name COLLATE NOCASE) WHERE deleted_at IS NULL;

-- Categories indexes
CREATE INDEX idx_categories_org ON categories(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE deleted_at IS NULL;

-- Locations indexes
CREATE INDEX idx_locations_org_active ON locations(organization_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_type ON locations(organization_id, type) WHERE deleted_at IS NULL;

-- Stock indexes
CREATE INDEX idx_stock_org_product ON stock(organization_id, product_id);
CREATE INDEX idx_stock_location ON stock(location_id);
CREATE INDEX idx_stock_product_location ON stock(product_id, location_id);
CREATE INDEX idx_stock_low_quantity ON stock(product_id, quantity) WHERE quantity > 0;

-- Sales indexes
CREATE INDEX idx_sales_org_date ON sales(organization_id, created_at DESC);
CREATE INDEX idx_sales_number ON sales(organization_id, sale_number);
CREATE INDEX idx_sales_location_date ON sales(location_id, created_at DESC);
CREATE INDEX idx_sales_customer ON sales(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX idx_sales_payment_status ON sales(organization_id, payment_status, created_at DESC);

-- Sale Items indexes
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- Inventory Movements indexes
CREATE INDEX idx_movements_org_date ON inventory_movements(organization_id, created_at DESC);
CREATE INDEX idx_movements_product ON inventory_movements(product_id, created_at DESC);
CREATE INDEX idx_movements_location ON inventory_movements(location_id, created_at DESC);
CREATE INDEX idx_movements_type ON inventory_movements(organization_id, type, created_at DESC);
CREATE INDEX idx_movements_reference ON inventory_movements(reference_type, reference_id) WHERE reference_id IS NOT NULL;

-- Suppliers indexes
CREATE INDEX idx_suppliers_org_active ON suppliers(organization_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_name ON suppliers(name COLLATE NOCASE) WHERE deleted_at IS NULL;

-- ============================================================================
-- CREATE COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Dashboard queries
CREATE INDEX idx_products_org_min_stock ON products(organization_id, min_stock_level) WHERE deleted_at IS NULL AND is_active = 1;

-- Report queries
CREATE INDEX idx_stock_value ON stock(organization_id, product_id, location_id, quantity) WHERE quantity > 0;

-- Search queries
CREATE INDEX idx_products_search ON products(organization_id, name, sku) WHERE deleted_at IS NULL;
