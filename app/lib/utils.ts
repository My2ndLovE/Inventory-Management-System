// Utility functions
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format as formatDate } from 'date-fns';

// Tailwind class merging utility (for shadcn/ui)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Format timestamp
export function formatTimestamp(timestamp: number, formatStr: string = 'PPP'): string {
  return formatDate(new Date(timestamp), formatStr);
}

// Generate SKU
export function generateSKU(prefix: string = 'PROD'): string {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Generate barcode
export function generateBarcode(orgPrefix: string = 'ORG'): string {
  const random = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0');
  return `${orgPrefix}${random}`;
}

// Generate sale number
export async function generateSaleNumber(
  db: D1Database,
  orgId: string
): Promise<string> {
  const today = new Date();
  const dateStr = formatDate(today, 'yyyyMMdd');
  const prefix = `SALE-${dateStr}`;

  // Get today's last sale number
  const lastSale = await db
    .prepare(
      `SELECT sale_number FROM sales
       WHERE organization_id = ? AND sale_number LIKE ?
       ORDER BY sale_number DESC LIMIT 1`
    )
    .bind(orgId, `${prefix}%`)
    .first<{ sale_number: string }>();

  let sequence = 1;
  if (lastSale) {
    const lastSequence = parseInt(lastSale.sale_number.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
}

// Slug generation
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Calculate sale totals
export interface SaleCalculation {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export function calculateSaleTotals(
  items: Array<{ quantity: number; unit_price: number }>,
  discountAmount: number = 0,
  taxRate: number = 0.06
): SaleCalculation {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const discountedAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = discountedAmount * taxRate;
  const totalAmount = discountedAmount + taxAmount;

  return {
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
  };
}

// Validate stock availability
export async function checkStockAvailability(
  db: D1Database,
  productId: string,
  locationId: string,
  requiredQuantity: number,
  variantId?: string
): Promise<{ available: boolean; currentStock: number }> {
  const stock = await db
    .prepare(
      `SELECT quantity, reserved_quantity FROM stock
       WHERE product_id = ? AND location_id = ? AND variant_id IS ?`
    )
    .bind(productId, locationId, variantId || null)
    .first<{ quantity: number; reserved_quantity: number }>();

  const currentStock = stock ? stock.quantity - stock.reserved_quantity : 0;
  return {
    available: currentStock >= requiredQuantity,
    currentStock,
  };
}
