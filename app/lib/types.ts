/**
 * Type definitions for the Inventory Management System
 * This file provides type safety across the application
 */

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Product {
  id: string;
  organization_id: string;
  category_id: string | null;
  sku: string;
  name: string;
  description: string | null;
  barcode: string | null;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  is_active: boolean;
  image_url: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  type: 'warehouse' | 'store' | 'online';
  is_active: boolean;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Stock {
  id: string;
  organization_id: string;
  product_id: string;
  variant_id: string | null;
  location_id: string;
  quantity: number;
  reserved_quantity: number;
  last_counted_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  product_id: string;
  variant_id: string | null;
  location_id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'SALE' | 'RETURN';
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  user_id: string;
  created_at: number;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
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
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'other';
  payment_status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  user_id: string;
  created_at: number;
  updated_at: number;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  created_at: number;
}

// ============================================================================
// EXTENDED TYPES (with joins)
// ============================================================================

export interface ProductWithStock extends Product {
  category_name: string | null;
  total_stock: number;
}

export interface ProductWithCategory extends Product {
  category_name: string | null;
}

export interface StockWithDetails extends Stock {
  product_name: string;
  product_sku: string;
  location_name: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
}

export interface InventoryMovementWithDetails extends InventoryMovement {
  product_name: string;
  product_sku: string;
  location_name: string;
}

export interface SaleWithDetails extends Sale {
  location_name: string;
  items_count: number;
}

export interface SaleItemWithDetails extends SaleItem {
  product_name: string;
  product_sku: string;
}

export interface SupplierWithStats extends Supplier {
  product_count: number;
}

// ============================================================================
// CART & FORM TYPES
// ============================================================================

export interface CartItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
}

export interface SaleCalculation {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface StockReportItem {
  product_id: string;
  sku: string;
  product_name: string;
  location_id: string;
  location_name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  value: number;
}

export interface LowStockReportItem {
  product_id: string;
  sku: string;
  product_name: string;
  location_id: string;
  location_name: string;
  current_stock: number;
  min_stock_level: number;
  reorder_quantity: number;
}

export interface SalesReportItem extends Sale {
  location_name: string;
  total_cost: number;
  profit: number;
}

export interface MovementReportItem extends InventoryMovement {
  product_name: string;
  product_sku: string;
  location_name: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  stockValue: number;
  recentSales: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  userId: string;
  orgId: string;
}

export interface ActionError {
  error: string;
  field?: string;
}

export interface ActionSuccess<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// ============================================================================
// DATABASE QUERY RESULT TYPES
// ============================================================================

export interface CountResult {
  count: number;
}

export interface SumResult {
  total: number | null;
}

export interface ExistsResult {
  exists: number; // SQLite returns 0 or 1
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  is_active: boolean;
  barcode?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

export interface LocationFormData {
  name: string;
  address?: string;
  type: 'warehouse' | 'store' | 'online';
  is_active: boolean;
}

export interface StockAdjustmentFormData {
  product_id: string;
  location_id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  notes?: string;
}

export interface StockTransferFormData {
  product_id: string;
  source_location_id: string;
  destination_location_id: string;
  quantity: number;
  notes?: string;
}

export interface SaleFormData {
  location_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  discount_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'other';
  notes?: string;
  items: CartItem[];
}

export interface SupplierFormData {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
}
