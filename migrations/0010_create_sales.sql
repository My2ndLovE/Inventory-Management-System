-- Migration: Create sales table
CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    sale_number TEXT NOT NULL,
    location_id TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    UNIQUE(organization_id, sale_number)
);

CREATE INDEX idx_sales_org ON sales(organization_id);
CREATE INDEX idx_sales_number ON sales(sale_number);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_location ON sales(location_id);
CREATE INDEX idx_sales_date_status ON sales(organization_id, created_at, payment_status);
