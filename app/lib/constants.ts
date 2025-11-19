/**
 * Application-wide constants
 * Centralized location for all magic numbers and configuration values
 */

// ============================================================================
// TAX AND PRICING
// ============================================================================

export const DEFAULT_TAX_RATE = 0.06; // 6% sales tax
export const MIN_PRICE = 0;
export const MAX_PRICE = 999999.99;

// ============================================================================
// PAGINATION
// ============================================================================

export const DEFAULT_PAGE_SIZE = 50;
export const MIN_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE = 1;

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

export const SKU_MAX_LENGTH = 50;
export const NAME_MAX_LENGTH = 255;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const NOTES_MAX_LENGTH = 500;
export const EMAIL_MAX_LENGTH = 255;
export const PHONE_MAX_LENGTH = 20;
export const ADDRESS_MAX_LENGTH = 500;

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

export const MIN_STOCK_QUANTITY = 0;
export const MAX_STOCK_QUANTITY = 999999;
export const DEFAULT_MIN_STOCK_LEVEL = 0;

// ============================================================================
// SALE NUMBERS
// ============================================================================

export const SALE_NUMBER_PREFIX = 'SALE';
export const SALE_NUMBER_SEQUENCE_LENGTH = 3;
export const SALE_NUMBER_DATE_FORMAT = 'yyyyMMdd';

// ============================================================================
// REPORT LIMITS
// ============================================================================

export const MAX_MOVEMENT_REPORT_ITEMS = 500;
export const EXPORT_BATCH_SIZE = 1000;

// ============================================================================
// CACHE SETTINGS
// ============================================================================

export const CACHE_TTL_SHORT = 60; // 1 minute
export const CACHE_TTL_MEDIUM = 300; // 5 minutes
export const CACHE_TTL_LONG = 3600; // 1 hour
export const CACHE_TTL_BARCODE = 31536000; // 1 year

// ============================================================================
// SECURITY
// ============================================================================

export const MAX_LOGIN_ATTEMPTS = 5;
export const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms
export const RATE_LIMIT_MAX_REQUESTS = 100;

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMAT_SHORT = 'MMM d, yyyy';
export const DATE_FORMAT_LONG = 'MMMM d, yyyy';
export const DATETIME_FORMAT = 'MMM d, yyyy h:mm a';
export const TIME_FORMAT = 'h:mm a';

// ============================================================================
// TOAST/NOTIFICATION SETTINGS
// ============================================================================

export const TOAST_LIMIT = 3;
export const TOAST_REMOVE_DELAY = 5000; // 5 seconds

// ============================================================================
// LOCATION TYPES
// ============================================================================

export const LOCATION_TYPES = {
  WAREHOUSE: 'warehouse',
  STORE: 'store',
  ONLINE: 'online',
} as const;

// ============================================================================
// MOVEMENT TYPES
// ============================================================================

export const MOVEMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
  SALE: 'SALE',
  RETURN: 'RETURN',
} as const;

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  OTHER: 'other',
} as const;

// ============================================================================
// PAYMENT STATUS
// ============================================================================

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

// ============================================================================
// BARCODE FORMATS
// ============================================================================

export const BARCODE_FORMATS = {
  CODE128: 'code128',
  QR_CODE: 'qrcode',
} as const;

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication
  AUTH_REQUIRED: 'Authentication required',
  AUTH_INVALID: 'Invalid authentication credentials',
  AUTH_EXPIRED: 'Session expired',

  // Authorization
  PERMISSION_DENIED: 'Permission denied',
  INVALID_ORGANIZATION: 'Invalid organization',

  // Validation
  INVALID_INPUT: 'Invalid input data',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_NUMBER: 'Invalid number',
  INVALID_DATE: 'Invalid date',

  // Stock
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  NEGATIVE_STOCK: 'Stock quantity cannot be negative',
  STOCK_NOT_FOUND: 'Stock record not found',

  // Products
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_INACTIVE: 'Product is inactive',
  SKU_DUPLICATE: 'SKU already exists',

  // Sales
  SALE_NOT_FOUND: 'Sale not found',
  INVALID_SALE_ITEMS: 'Invalid sale items',
  EMPTY_CART: 'Cart cannot be empty',

  // Database
  DB_ERROR: 'Database operation failed',
  DB_CONSTRAINT: 'Database constraint violation',
  DB_TIMEOUT: 'Database operation timed out',

  // General
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',

  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',

  LOCATION_CREATED: 'Location created successfully',
  LOCATION_UPDATED: 'Location updated successfully',
  LOCATION_DELETED: 'Location deleted successfully',

  STOCK_ADJUSTED: 'Stock adjusted successfully',
  STOCK_TRANSFERRED: 'Stock transferred successfully',

  SALE_CREATED: 'Sale recorded successfully',
  SALE_UPDATED: 'Sale updated successfully',

  SUPPLIER_CREATED: 'Supplier created successfully',
  SUPPLIER_UPDATED: 'Supplier updated successfully',
  SUPPLIER_DELETED: 'Supplier deleted successfully',
} as const;
