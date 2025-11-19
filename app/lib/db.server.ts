// Database utilities for D1
import type { AppLoadContext } from '~/types';

export function getDb(context: AppLoadContext): D1Database {
  return context.DB;
}

// Generate UUID v4
export function generateId(): string {
  return crypto.randomUUID();
}

// Get current timestamp
export function now(): number {
  return Date.now();
}

// Execute a query with error handling
export async function executeQuery<T = unknown>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<D1Result<T>> {
  try {
    const stmt = db.prepare(query);
    return await stmt.bind(...params).all();
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  }
}

// Execute a single query
export async function executeSingle<T = unknown>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  try {
    const stmt = db.prepare(query);
    return await stmt.bind(...params).first();
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  }
}

// Execute multiple queries in a transaction (batch)
export async function executeTransaction(
  db: D1Database,
  statements: D1PreparedStatement[]
): Promise<D1Result[]> {
  try {
    return await db.batch(statements);
  } catch (error) {
    console.error('Transaction error:', error);
    throw new Error('Transaction failed');
  }
}

// Helper to create a prepared statement
export function prepareStatement(
  db: D1Database,
  query: string,
  params: unknown[] = []
): D1PreparedStatement {
  return db.prepare(query).bind(...params);
}

// Pagination helper
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getPaginationParams(url: URL): PaginationParams {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  return { page: Math.max(1, page), limit: Math.min(100, Math.max(1, limit)) };
}

export function calculatePagination(total: number, params: PaginationParams): PaginationResult {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}

export function getPaginationOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}
