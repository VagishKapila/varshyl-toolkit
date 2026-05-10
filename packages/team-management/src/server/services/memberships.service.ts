import type { Pool } from 'pg';
import type { TmMembership, OrgRole } from '../types.js';
import { ROLE_HIERARCHY } from '../types.js';

export async function getMembership(
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

export async function addMember(
  pool: Pool,
  { orgId, userId, role }: { orgId: number; userId: number; role: OrgRole }
): Promise<TmMembership> {
  const result = await pool.query<TmMembership>(
    `INSERT INTO tm_memberships (org_id, user_id, role, joined_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (org_id, user_id)
     DO UPDATE SET role = EXCLUDED.role, removed_at = NULL, removed_by_user_id = NULL,
                   removal_reason = NULL, updated_at = NOW()
     RETURNING *`,
    [orgId, userId, role]
  );
  return result.rows[0];
}

export async function removeMember(
  pool: Pool,
  {
    orgId,
    userId,
    removedByUserId,
    reason,
  }: { orgId: number; userId: number; removedByUserId: number; reason?: string }
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const memberResult = await client.query(
      `UPDATE tm_memberships
       SET removed_at = NOW(), removed_by_user_id = $1, removal_reason = $2, updated_at = NOW()
       WHERE org_id = $3 AND user_id = $4 AND removed_at IS NULL`,
      [removedByUserId, reason ?? null, orgId, userId]
    );
    if ((memberResult.rowCount ?? 0) === 0) {
      throw new Error('Membership not found or already removed');
    }

    await client.query(
      `UPDATE tm_invitations
       SET revoked_at = NOW(), revoked_by_user_id = $1, updated_at = NOW()
       WHERE org_id = $2 AND invited_by_user_id = $3 AND revoked_at IS NULL AND accepted_at IS NULL`,
      [removedByUserId, orgId, userId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function changeRole(
  pool: Pool,
  {
    orgId,
    userId,
    newRole,
    changedByUserId: _changedByUserId,
  }: { orgId: number; userId: number; newRole: OrgRole; changedByUserId: number }
): Promise<TmMembership> {
  const result = await pool.query<TmMembership>(
    `UPDATE tm_memberships
     SET role = $1, updated_at = NOW()
     WHERE org_id = $2 AND user_id = $3 AND removed_at IS NULL
     RETURNING *`,
    [newRole, orgId, userId]
  );
  if (result.rows.length === 0) throw new Error('Membership not found');
  return result.rows[0];
}

export async function validateRoleChange(
  pool: Pool,
  {
    orgId,
    actorRole,
    targetUserId,
    newRole,
  }: { orgId: number; actorRole: OrgRole; targetUserId: number; newRole: OrgRole }
): Promise<void> {
  if (newRole === 'owner') {
    throw new Error('Cannot assign owner role directly. Use the ownership transfer flow.');
  }

  if (ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY['admin']) {
    throw new Error('Requires admin role or higher to change member roles');
  }

  const result = await pool.query<TmMembership>(
    `SELECT role FROM tm_memberships WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
    [orgId, targetUserId]
  );
  if (result.rows.length === 0) throw new Error('Target user is not a member of this organization');

  const targetCurrentRole = result.rows[0].role;

  // Protect the owner role — must use ownership transfer flow to change it
  if (targetCurrentRole === 'owner') {
    throw new Error('Cannot change the owner role. Use the ownership transfer flow to transfer ownership first.');
  }

  if (actorRole !== 'owner' && ROLE_HIERARCHY[targetCurrentRole] >= ROLE_HIERARCHY[actorRole]) {
    throw new Error('You cannot change the role of a member with equal or higher permissions');
  }

  if (actorRole !== 'owner' && ROLE_HIERARCHY[newRole] >= ROLE_HIERARCHY[actorRole]) {
    throw new Error('You cannot assign a role equal to or higher than your own');
  }
}
