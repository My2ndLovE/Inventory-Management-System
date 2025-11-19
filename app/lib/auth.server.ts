// Authentication utilities
import type { AppLoadContext } from '~/types';

export interface AuthUser {
  userId: string;
  orgId: string;
}

// Mock authentication for development
// TODO: Replace with Clerk authentication
export async function requireAuth(request: Request, context: AppLoadContext): Promise<AuthUser> {
  // For development, we'll use a mock user
  // In production, this would validate Clerk session
  const userId = request.headers.get('X-User-Id') || 'dev-user-1';
  const orgId = request.headers.get('X-Org-Id') || await getOrCreateDevOrg(context);

  return { userId, orgId };
}

// Get or create development organization
async function getOrCreateDevOrg(context: AppLoadContext): Promise<string> {
  const db = context.DB;

  // Check if dev org exists
  const existing = await db
    .prepare('SELECT id FROM organizations WHERE owner_clerk_id = ? LIMIT 1')
    .bind('dev-user-1')
    .first<{ id: string }>();

  if (existing) {
    return existing.id;
  }

  // Create dev org
  const orgId = crypto.randomUUID();
  const now = Date.now();

  await db
    .prepare(`
      INSERT INTO organizations (id, name, owner_clerk_id, slug, currency, timezone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(orgId, 'Development Org', 'dev-user-1', 'dev-org', 'USD', 'UTC', now, now)
    .run();

  // Create default location
  const locationId = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO locations (id, organization_id, name, type, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(locationId, orgId, 'Main Warehouse', 'warehouse', 1, now, now)
    .run();

  return orgId;
}

export async function getOrganization(db: D1Database, orgId: string) {
  return await db
    .prepare('SELECT * FROM organizations WHERE id = ? AND deleted_at IS NULL')
    .bind(orgId)
    .first();
}

export async function getUserOrganizations(db: D1Database, userId: string) {
  return await db
    .prepare('SELECT * FROM organizations WHERE owner_clerk_id = ? AND deleted_at IS NULL')
    .bind(userId)
    .all();
}
