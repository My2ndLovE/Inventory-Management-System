-- Migration: Create stock table
CREATE TABLE stock (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    product_id TEXT,
    variant_id TEXT,
    location_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE(product_id, variant_id, location_id)
);

CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_location ON stock(location_id);
CREATE INDEX idx_stock_low ON stock(organization_id, quantity);
CREATE INDEX idx_stock_low_products ON stock(organization_id, location_id, quantity);
