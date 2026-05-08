import type { Pool } from 'pg';
import type { TmOrganization, TmMembership } from '../types.js';

export async function createOrg(
  pool: Pool,
  { name, slug, ownerUserId }: { name: string; slug: string; ownerUserId: number }
): Promise<TmOrganization> {
  const result = await pool.query<TmOrganization>(
    `INSERT INTO tm_organizations (name, slug, owner_user_id, settings)
     VALUES ($1, $2, $3, '{}')
     RETURNING *`,
    [name, slug, ownerUserId]
  );
  return result.rows[0];
}

export async function getOrg(pool: Pool, orgId: number): Promise<TmOrganization | null> {
  const result = await pool.query<TmOrganization>(
    `SELECT * FROM tm_organizations WHERE id = $1 AND deleted_at IS NULL`,
    [orgId]
  );
  return result.rows[0] ?? null;
}

export async function getOrgBySlug(pool: Pool, slug: string): Promise<TmOrganization | null> {
  const result = await pool.query<TmOrganization>(
    `SELECT * FROM tm_organizations WHERE slug = $1 AND deleted_at IS NULL`,
    [slug]
  );
  return result.rows[0] ?? null;
}

export async function updateOrg(
  pool: Pool,
  orgId: number,
  updates: { name?: string; slug?: string }
): Promise<TmOrganization> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.slug !== undefined) {
    fields.push(`slug = $${idx++}`);
    values.push(updates.slug);
  }
  if (fields.length === 0) {
    const existing = await getOrg(pool, orgId);
    if (!existing) throw new Error('Organization not found');
    return existing;
  }

  fields.push(`updated_at = NOW()`);
  values.push(orgId);

  const result = await pool.query<TmOrganization>(
    `UPDATE tm_organizations SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
    values
  );
  if (result.rows.length === 0) throw new Error('Organization not found or already deleted');
  return result.rows[0];
}

export async function softDeleteOrg(
  pool: Pool,
  orgId: number,
  deletedByUserId: number
): Promise<void> {
  const result = await pool.query(
    `UPDATE tm_organizations
     SET deleted_at = NOW(),
         delete_scheduled_for = NOW() + INTERVAL '30 days',
         deleted_by_user_id = $1,
         updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL`,
    [deletedByUserId, orgId]
  );
  if (result.rowCount === 0) throw new Error('Organization not found or already deleted');
}

export async function listOrgMembers(
  pool: Pool,
  orgId: number,
  { includeRemoved = false }: { includeRemoved?: boolean } = {}
): Promise<TmMembership[]> {
  const whereClause = includeRemoved
    ? `WHERE org_id = $1`
    : `WHERE org_id = $1 AND removed_at IS NULL`;

  const result = await pool.query<TmMembership>(
    `SELECT * FROM tm_memberships ${whereClause} ORDER BY joined_at ASC`,
    [orgId]
  );
  return result.rows;
}

export async function getActiveMembership(
  pool: Pool,
  orgId: number,
  userId: number
): Promise<TmMembership | null> {
  const result = await pool.query<TmMembership>(
    `SELECT * FROM tm_memberships WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
    [orgId, userId]
  );
  return result.rows[0] ?? null;
}
