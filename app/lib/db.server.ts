// Database utilities for D1
import type { AppLoadContext } from '~/types';
import type { PaginationParams, CountResult } from './types';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  DEFAULT_PAGE,
  ERROR_MESSAGES,
} from './constants';

export function getDb(context: AppLoadContext): D1Database {
  return context.DB;
}

// ============================================================================
// ID AND TIMESTAMP UTILITIES
// ============================================================================

// Generate UUID v4
export function generateId(): string {
  return crypto.randomUUID();
}

// Get current timestamp
export function now(): number {
  return Date.now();
}

// ============================================================================
// SQL SANITIZATION
// ============================================================================

/**
 * Sanitize input for SQL LIKE patterns
 * Escapes special characters: % and _
 */
export function sanitizeLikePattern(input: string): string {
  return input.replace(/[%_]/g, '\\$&');
}

/**
 * Create a safe search pattern with wildcards
 */
export function createSearchPattern(search: string): string {
  const sanitized = sanitizeLikePattern(search.trim());
  return `%${sanitized}%`;
}

// ============================================================================
// QUERY EXECUTION WITH ERROR HANDLING
// ============================================================================

/**
 * Execute a query that returns multiple rows
 */
export async function executeQuery<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all<T>();
    return result.results || [];
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw new Error(ERROR_MESSAGES.DB_ERROR);
  }
}

/**
 * Execute a query that returns a single row
 */
export async function executeSingle<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  try {
    const stmt = db.prepare(query);
    return await stmt.bind(...params).first<T>();
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw new Error(ERROR_MESSAGES.DB_ERROR);
  }
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
export async function executeModify(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<D1Result> {
  try {
    const stmt = db.prepare(query);
    return await stmt.bind(...params).run();
  } catch (error) {
    console.error('Database modification error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw new Error(ERROR_MESSAGES.DB_ERROR);
  }
}

/**
 * Execute multiple queries in a transaction (batch)
 * All queries succeed or all fail (atomic)
 */
export async function executeTransaction(
  db: D1Database,
  statements: D1PreparedStatement[]
): Promise<D1Result[]> {
  try {
    return await db.batch(statements);
  } catch (error) {
    console.error('Transaction error:', error);
    throw new Error(ERROR_MESSAGES.DB_ERROR);
  }
}

/**
 * Helper to create a prepared statement
 */
export function prepareStatement(
  db: D1Database,
  query: string,
  params: unknown[] = []
): D1PreparedStatement {
  return db.prepare(query).bind(...params);
}

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

export function getPaginationParams(url: URL): PaginationParams {
  const pageStr = url.searchParams.get('page');
  const limitStr = url.searchParams.get('limit');

  const page = pageStr ? Math.max(1, parseInt(pageStr, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
  const limit = limitStr
    ? Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, parseInt(limitStr, 10) || DEFAULT_PAGE_SIZE))
    : DEFAULT_PAGE_SIZE;

  return { page, limit };
}

export function getPaginationOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

/**
 * Get total count for pagination
 */
export async function getTotalCount(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<number> {
  const result = await executeSingle<CountResult>(db, query, params);
  return result?.count || 0;
}

// ============================================================================
// COMMON QUERY HELPERS
// ============================================================================

/**
 * Check if a record exists
 */
export async function recordExists(
  db: D1Database,
  table: string,
  whereClause: string,
  params: unknown[]
): Promise<boolean> {
  const query = `SELECT 1 as exists FROM ${table} WHERE ${whereClause} LIMIT 1`;
  const result = await executeSingle<{ exists: number }>(db, query, params);
  return !!result;
}

/**
 * Soft delete a record (set deleted_at timestamp)
 */
export async function softDelete(
  db: D1Database,
  table: string,
  id: string,
  orgId: string
): Promise<void> {
  const query = `
    UPDATE ${table}
    SET deleted_at = ?
    WHERE id = ? AND organization_id = ? AND deleted_at IS NULL
  `;
  await executeModify(db, query, [now(), id, orgId]);
}

/**
 * Get record by ID with org check
 */
export async function getById<T>(
  db: D1Database,
  table: string,
  id: string,
  orgId: string,
  includeDeleted = false
): Promise<T | null> {
  const deletedCheck = includeDeleted ? '' : 'AND deleted_at IS NULL';
  const query = `
    SELECT * FROM ${table}
    WHERE id = ? AND organization_id = ? ${deletedCheck}
    LIMIT 1
  `;
  return executeSingle<T>(db, query, [id, orgId]);
}
