// Zod validation schemas
import { z } from 'zod';
import {
  SKU_MAX_LENGTH,
  NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  ADDRESS_MAX_LENGTH,
  MIN_PRICE,
  MAX_PRICE,
  MIN_STOCK_QUANTITY,
  MAX_STOCK_QUANTITY,
  ERROR_MESSAGES,
} from './constants';

// ============================================================================
// ORGANIZATION
// ============================================================================

export const organizationSchema = z.object({
  name: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD).max(NAME_MAX_LENGTH),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
});

// ============================================================================
// CATEGORY
// ============================================================================

export const categorySchema = z.object({
  name: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD).max(NAME_MAX_LENGTH),
  description: z.string().max(DESCRIPTION_MAX_LENGTH).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
});

// ============================================================================
// PRODUCT
// ============================================================================

export const productSchema = z
  .object({
    sku: z
      .string()
      .min(1, 'SKU is required')
      .max(SKU_MAX_LENGTH)
      .regex(/^[a-zA-Z0-9-_]+$/, 'SKU can only contain letters, numbers, dashes, and underscores'),
    name: z.string().min(1, 'Name is required').max(NAME_MAX_LENGTH),
    description: z.string().max(DESCRIPTION_MAX_LENGTH).optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    barcode: z.string().max(SKU_MAX_LENGTH).optional().nullable(),
    unit_of_measure: z.string().default('pcs'),
    cost_price: z
      .number()
      .min(MIN_PRICE, 'Cost price must be positive')
      .max(MAX_PRICE, 'Cost price is too high'),
    selling_price: z
      .number()
      .min(MIN_PRICE, 'Selling price must be positive')
      .max(MAX_PRICE, 'Selling price is too high'),
    min_stock_level: z
      .number()
      .int()
      .min(MIN_STOCK_QUANTITY)
      .max(MAX_STOCK_QUANTITY)
      .default(0),
    max_stock_level: z.number().int().min(0).max(MAX_STOCK_QUANTITY).optional().nullable(),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.selling_price >= data.cost_price, {
    message: 'Selling price should be greater than or equal to cost price',
    path: ['selling_price'],
  });

// ============================================================================
// PRODUCT VARIANT
// ============================================================================

export const productVariantSchema = z.object({
  product_id: z.string().uuid(),
  sku: z.string().min(1).max(SKU_MAX_LENGTH),
  name: z.string().min(1).max(NAME_MAX_LENGTH),
  barcode: z.string().max(SKU_MAX_LENGTH).optional().nullable(),
  cost_price: z.number().min(MIN_PRICE).max(MAX_PRICE),
  selling_price: z.number().min(MIN_PRICE).max(MAX_PRICE),
  attributes: z.record(z.string()).optional().nullable(),
});

// ============================================================================
// LOCATION
// ============================================================================

export const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(NAME_MAX_LENGTH),
  address: z.string().max(ADDRESS_MAX_LENGTH).optional().nullable(),
  type: z.enum(['warehouse', 'store', 'online']).default('warehouse'),
  is_active: z.boolean().default(true),
});

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  variant_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid('Invalid location ID'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive')
    .max(MAX_STOCK_QUANTITY, 'Quantity is too large'),
  notes: z.string().max(NOTES_MAX_LENGTH).optional().nullable(),
});

export const stockTransferSchema = z
  .object({
    product_id: z.string().uuid('Invalid product ID'),
    variant_id: z.string().uuid().optional().nullable(),
    from_location_id: z.string().uuid('Invalid source location'),
    to_location_id: z.string().uuid('Invalid destination location'),
    quantity: z
      .number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be positive')
      .max(MAX_STOCK_QUANTITY, 'Quantity is too large'),
    notes: z.string().max(NOTES_MAX_LENGTH).optional().nullable(),
  })
  .refine((data) => data.from_location_id !== data.to_location_id, {
    message: 'Source and destination locations must be different',
    path: ['to_location_id'],
  });

// ============================================================================
// SUPPLIER
// ============================================================================

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(NAME_MAX_LENGTH),
  contact_person: z.string().max(NAME_MAX_LENGTH).optional().nullable(),
  email: z
    .string()
    .max(EMAIL_MAX_LENGTH)
    .refine(
      (val) => {
        if (!val || val === '') return true;
        return z.string().email().safeParse(val).success;
      },
      {
        message: ERROR_MESSAGES.INVALID_EMAIL,
      }
    )
    .optional()
    .nullable(),
  phone: z.string().max(PHONE_MAX_LENGTH).optional().nullable(),
  address: z.string().max(ADDRESS_MAX_LENGTH).optional().nullable(),
  notes: z.string().max(NOTES_MAX_LENGTH).optional().nullable(),
  is_active: z.boolean().default(true),
});

// ============================================================================
// SALES
// ============================================================================

export const saleItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  variant_id: z.string().uuid().optional().nullable(),
  product_name: z.string().min(1).max(NAME_MAX_LENGTH),
  sku: z.string().min(1).max(SKU_MAX_LENGTH),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive')
    .max(MAX_STOCK_QUANTITY),
  unit_price: z.number().min(MIN_PRICE).max(MAX_PRICE),
  cost_price: z.number().min(MIN_PRICE).max(MAX_PRICE),
});

export const saleSchema = z.object({
  location_id: z.string().uuid('Invalid location ID'),
  customer_name: z.string().max(NAME_MAX_LENGTH).optional().nullable(),
  customer_email: z
    .string()
    .max(EMAIL_MAX_LENGTH)
    .refine(
      (val) => {
        if (!val || val === '') return true;
        return z.string().email().safeParse(val).success;
      },
      {
        message: ERROR_MESSAGES.INVALID_EMAIL,
      }
    )
    .optional()
    .nullable(),
  customer_phone: z.string().max(PHONE_MAX_LENGTH).optional().nullable(),
  items: z.array(saleItemSchema).min(1, ERROR_MESSAGES.EMPTY_CART),
  payment_method: z.enum(['cash', 'card', 'transfer', 'other']).default('cash'),
  payment_status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
  discount_amount: z.number().min(0).max(MAX_PRICE).default(0),
  notes: z.string().max(NOTES_MAX_LENGTH).optional().nullable(),
});

// ============================================================================
// FORM DATA HELPERS
// ============================================================================

/**
 * Parse form data into a typed object using Zod schema
 * Handles arrays and nested objects
 */
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

/**
 * Safe parse that returns errors instead of throwing
 */
export function safeParseFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const data: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) {
        data[arrayKey] = [];
      }
      (data[arrayKey] as unknown[]).push(value);
    } else {
      data[key] = value;
    }
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}
