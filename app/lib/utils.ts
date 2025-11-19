// Utility functions
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format as formatDate } from 'date-fns';
import type { CartItem, SaleCalculation } from './types';
import {
  DEFAULT_TAX_RATE,
  SALE_NUMBER_PREFIX,
  SALE_NUMBER_SEQUENCE_LENGTH,
  SALE_NUMBER_DATE_FORMAT,
} from './constants';
import { executeSingle } from './db.server';

// ============================================================================
// CLASS NAME UTILITIES
// ============================================================================

/**
 * Tailwind class merging utility (for shadcn/ui)
 * Combines clsx and tailwind-merge for proper CSS class handling
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format currency with proper localization
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format timestamp with date-fns
 */
export function formatTimestamp(timestamp: number, formatStr: string = 'PPP'): string {
  return formatDate(new Date(timestamp), formatStr);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// ============================================================================
// ID GENERATION UTILITIES
// ============================================================================

/**
 * Generate unique SKU for products
 */
export function generateSKU(prefix: string = 'PROD'): string {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate barcode number
 */
export function generateBarcode(orgPrefix: string = 'ORG'): string {
  const random = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0');
  return `${orgPrefix}${random}`;
}

/**
 * Generate sequential sale number for the day
 * Format: SALE-YYYYMMDD-XXX
 */
export async function generateSaleNumber(db: D1Database, orgId: string): Promise<string> {
  const today = new Date();
  const dateStr = formatDate(today, SALE_NUMBER_DATE_FORMAT);
  const prefix = `${SALE_NUMBER_PREFIX}-${dateStr}`;

  // Get today's last sale number
  const lastSale = await executeSingle<{ sale_number: string }>(
    db,
    `SELECT sale_number FROM sales
     WHERE organization_id = ? AND sale_number LIKE ?
     ORDER BY sale_number DESC LIMIT 1`,
    [orgId, `${prefix}%`]
  );

  let sequence = 1;
  if (lastSale) {
    const parts = lastSale.sale_number.split('-');
    const lastSequence = parseInt(parts[parts.length - 1] || '0', 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${sequence.toString().padStart(SALE_NUMBER_SEQUENCE_LENGTH, '0')}`;
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Convert text to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate sale totals with tax and discount
 * Uses precise decimal arithmetic to avoid floating point errors
 */
export function calculateSaleTotals(
  items: CartItem[],
  discountAmount: number = 0,
  taxRate: number = DEFAULT_TAX_RATE
): SaleCalculation {
  // Calculate subtotal from items
  const subtotal = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unit_price * 100) / 100,
    0
  );

  // Apply discount (cannot exceed subtotal)
  const validDiscountAmount = Math.max(0, Math.min(discountAmount, subtotal));
  const discountedAmount = subtotal - validDiscountAmount;

  // Calculate tax on discounted amount
  const taxAmount = Math.round(discountedAmount * taxRate * 100) / 100;

  // Calculate final total
  const totalAmount = discountedAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(validDiscountAmount * 100) / 100,
    taxAmount,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(cost: number, price: number): number {
  if (price === 0) return 0;
  return Math.round(((price - cost) / price) * 100 * 100) / 100;
}

/**
 * Calculate markup percentage
 */
export function calculateMarkup(cost: number, price: number): number {
  if (cost === 0) return 0;
  return Math.round(((price - cost) / cost) * 100 * 100) / 100;
}

// ============================================================================
// STOCK VALIDATION UTILITIES
// ============================================================================

/**
 * Check if sufficient stock is available for a transaction
 * Returns available quantity (accounting for reserved stock)
 */
export async function checkStockAvailability(
  db: D1Database,
  productId: string,
  locationId: string,
  requiredQuantity: number,
  variantId: string | null = null
): Promise<{ available: boolean; currentStock: number; availableStock: number }> {
  const stock = await executeSingle<{ quantity: number; reserved_quantity: number }>(
    db,
    `SELECT quantity, reserved_quantity FROM stock
     WHERE product_id = ? AND location_id = ? AND variant_id IS ?`,
    [productId, locationId, variantId]
  );

  const currentStock = stock?.quantity || 0;
  const reservedQuantity = stock?.reserved_quantity || 0;
  const availableStock = currentStock - reservedQuantity;

  return {
    available: availableStock >= requiredQuantity,
    currentStock,
    availableStock,
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Parse and validate numeric form input
 */
export function parseFormNumber(
  value: FormDataEntryValue | null,
  defaultValue: number = 0
): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse and validate integer form input
 */
export function parseFormInt(value: FormDataEntryValue | null, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value.toString(), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse and validate boolean form input
 */
export function parseFormBoolean(value: FormDataEntryValue | null): boolean {
  if (!value) return false;
  const str = value.toString().toLowerCase();
  return str === 'true' || str === '1' || str === 'on';
}
