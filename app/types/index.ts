// TypeScript type definitions for the application

export interface Organization {
  id: string;
  name: string;
  owner_clerk_id: string;
  slug: string;
  currency: string;
  timezone: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  barcode: string | null;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  max_stock_level: number | null;
  image_url: string | null;
  is_active: number;
  has_variants: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  barcode: string | null;
  cost_price: number;
  selling_price: number;
  attributes: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  type: string;
  is_active: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Stock {
  id: string;
  organization_id: string;
  product_id: string | null;
  variant_id: string | null;
  location_id: string;
  quantity: number;
  reserved_quantity: number;
  updated_at: number;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  product_id: string | null;
  variant_id: string | null;
  location_id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  from_location_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  unit_cost: number | null;
  notes: string | null;
  created_by: string;
  created_at: number;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  supplier_sku: string | null;
  cost_price: number | null;
  lead_time_days: number | null;
  min_order_quantity: number;
  is_preferred: number;
  created_at: number;
  updated_at: number;
}

export interface Sale {
  id: string;
  organization_id: string;
  sale_number: string;
  location_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'partial';
  notes: string | null;
  created_by: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  subtotal: number;
  created_at: number;
}

export interface AppLoadContext {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
}
