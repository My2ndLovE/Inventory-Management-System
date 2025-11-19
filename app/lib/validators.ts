// Zod validation schemas
import { z } from 'zod';

// Organization
export const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
});

// Category
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional(),
});

// Product
export const productSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50)
    .regex(/^[a-zA-Z0-9-_]+$/, 'SKU can only contain letters, numbers, dashes, and underscores'),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  barcode: z.string().optional(),
  unit_of_measure: z.string().default('pcs'),
  cost_price: z.number().min(0, 'Cost price must be positive'),
  selling_price: z.number().min(0, 'Selling price must be positive'),
  min_stock_level: z.number().int().min(0).default(0),
  max_stock_level: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
});

// Product Variant
export const productVariantSchema = z.object({
  product_id: z.string().uuid(),
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  barcode: z.string().optional(),
  cost_price: z.number().min(0),
  selling_price: z.number().min(0),
  attributes: z.record(z.string()).optional(),
});

// Location
export const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  address: z.string().optional(),
  type: z.enum(['warehouse', 'store', 'online']).default('warehouse'),
  is_active: z.boolean().default(true),
});

// Stock Adjustment
export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  location_id: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().max(500).optional(),
});

// Stock Transfer
export const stockTransferSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  from_location_id: z.string().uuid(),
  to_location_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().max(500).optional(),
}).refine(data => data.from_location_id !== data.to_location_id, {
  message: 'Source and destination locations must be different',
  path: ['to_location_id'],
});

// Supplier
export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Sale Item
export const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  product_name: z.string(),
  sku: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0),
  cost_price: z.number().min(0),
});

// Sale
export const saleSchema = z.object({
  location_id: z.string().uuid(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_phone: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  payment_method: z.enum(['cash', 'card', 'transfer']).optional(),
  payment_status: z.enum(['pending', 'paid', 'partial']).default('paid'),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Helper to parse form data
export function parseFormData<T>(schema: z.ZodSchema<T>, formData: FormData): T {
  const data: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (key.endsWith('[]')) {
      // Handle arrays
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) {
        data[arrayKey] = [];
      }
      (data[arrayKey] as unknown[]).push(value);
    } else {
      data[key] = value;
    }
  }

  return schema.parse(data);
}
