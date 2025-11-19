-- Migration: Create inventory_movements table
CREATE TABLE inventory_movements (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    product_id TEXT,
    variant_id TEXT,
    location_id TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    from_location_id TEXT,
    reference_id TEXT,
    reference_type TEXT,
    unit_cost REAL,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (from_location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE INDEX idx_movements_org ON inventory_movements(organization_id);
CREATE INDEX idx_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_movements_location ON inventory_movements(location_id);
CREATE INDEX idx_movements_type ON inventory_movements(type);
CREATE INDEX idx_movements_date ON inventory_movements(created_at);
CREATE INDEX idx_movements_date_type ON inventory_movements(organization_id, created_at, type);
