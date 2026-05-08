import type { Pool } from 'pg';
import type { TmOrganization, TmMembership, OrgRole, ServerModuleAdapter } from '../types.js';
import { writeAuditEvent } from './audit.service.js';
import { requestPasswordReset } from './password-reset.service.js';

export async function listAllOrgs(pool: Pool): Promise<TmOrganization[]> {
  const result = await pool.query<TmOrganization>(
    `SELECT * FROM tm_organizations ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getOrgForAdmin(
  pool: Pool,
  orgId: number
): Promise<TmOrganization & { memberCount: number }> {
  const result = await pool.query(
    `SELECT o.*,
            COUNT(m.id) FILTER (WHERE m.removed_at IS NULL) AS member_count
     FROM tm_organizations o
     LEFT JOIN tm_memberships m ON m.org_id = o.id
     WHERE o.id = $1
     GROUP BY o.id`,
    [orgId]
  );
  if (result.rows.length === 0) throw new Error('Organization not found');
  const row = result.rows[0];
  return { ...row, memberCount: parseInt(row.member_count, 10) };
}

export async function getUserForAdmin(
  pool: Pool,
  adapter: ServerModuleAdapter,
  userId: number
): Promise<{ id: number; email: string; name?: string; memberships: TmMembership[] }> {
  const user = await adapter.getUserById(userId);
  if (!user) throw new Error('User not found');

  const memberships = await pool.query<TmMembership>(
    `SELECT * FROM tm_memberships WHERE user_id = $1 ORDER BY joined_at DESC`,
    [userId]
  );
  return { ...user, memberships: memberships.rows };
}

export async function restoreOrg(
  pool: Pool,
  {
    orgId,
    superAdminUserId,
    reason,
  }: { orgId: number; superAdminUserId: number; reason: string }
): Promise<void> {
  const result = await pool.query(
    `UPDATE tm_organizations
     SET deleted_at = NULL, delete_scheduled_for = NULL, deleted_by_user_id = NULL, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NOT NULL`,
    [orgId]
  );
  if ((result.rowCount ?? 0) === 0) throw new Error('Organization not found or not deleted');

  await writeAuditEvent({
    pool,
    orgId,
    actorUserId: superAdminUserId,
    actorType: 'super_admin',
    action: 'org.restored',
    targetType: 'org',
    targetId: orgId,
    reason,
  });
}

export async function appointOwner(
  pool: Pool,
  {
    orgId,
    targetUserId,
    superAdminUserId,
    reason,
  }: { orgId: number; targetUserId: number; superAdminUserId: number; reason: string }
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Demote current owner to admin
    await client.query(
      `UPDATE tm_memberships SET role = 'admin', updated_at = NOW()
       WHERE org_id = $1 AND role = 'owner' AND removed_at IS NULL`,
      [orgId]
    );

    // Upsert new owner
    await client.query(
      `INSERT INTO tm_memberships (org_id, user_id, role, joined_at)
       VALUES ($1, $2, 'owner', NOW())
       ON CONFLICT (org_id, user_id)
       DO UPDATE SET role = 'owner', removed_at = NULL, updated_at = NOW()`,
      [orgId, targetUserId]
    );

    // Update denormalized owner field
    await client.query(
      `UPDATE tm_organizations SET owner_user_id = $1, updated_at = NOW() WHERE id = $2`,
      [targetUserId, orgId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  await writeAuditEvent({
    pool,
    orgId,
    actorUserId: superAdminUserId,
    actorType: 'super_admin',
    action: 'org.owner_appointed',
    targetType: 'user',
    targetId: targetUserId,
    reason,
  });
}

export async function hardDeleteOrg(
  pool: Pool,
  {
    orgId,
    superAdminUserId,
    legalBasis,
  }: { orgId: number; superAdminUserId: number; legalBasis: string }
): Promise<void> {
  if (!legalBasis || legalBasis.trim().length < 10) {
    throw new Error('A legal basis of at least 10 characters is required for hard delete');
  }

  await writeAuditEvent({
    pool,
    orgId,
    actorUserId: superAdminUserId,
    actorType: 'super_admin',
    action: 'org.hard_deleted',
    targetType: 'org',
    targetId: orgId,
    reason: legalBasis,
  });

  // Hard delete — cascades to memberships, invitations, etc.
  await pool.query(`DELETE FROM tm_organizations WHERE id = $1`, [orgId]);
}

export async function addMemberAdmin(
  pool: Pool,
  {
    orgId,
    userId,
    role,
    superAdminUserId,
    reason,
  }: { orgId: number; userId: number; role: OrgRole; superAdminUserId: number; reason: string }
): Promise<void> {
  await pool.query(
    `INSERT INTO tm_memberships (org_id, user_id, role, joined_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (org_id, user_id)
     DO UPDATE SET role = EXCLUDED.role, removed_at = NULL, removed_by_user_id = NULL,
                   removal_reason = NULL, updated_at = NOW()`,
    [orgId, userId, role]
  );

  await writeAuditEvent({
    pool,
    orgId,
    actorUserId: superAdminUserId,
    actorType: 'super_admin',
    action: 'org.member_added_admin',
    targetType: 'user',
    targetId: userId,
    after: { role },
    reason,
  });
}

export async function removeMemberAdmin(
  pool: Pool,
  {
    orgId,
    userId,
    superAdminUserId,
    reason,
  }: { orgId: number; userId: number; superAdminUserId: number; reason: string }
): Promise<void> {
  await pool.query(
    `UPDATE tm_memberships
     SET removed_at = NOW(), removed_by_user_id = $1, removal_reason = $2, updated_at = NOW()
     WHERE org_id = $3 AND user_id = $4 AND removed_at IS NULL`,
    [superAdminUserId, reason, orgId, userId]
  );

  await writeAuditEvent({
    pool,
    orgId,
    actorUserId: superAdminUserId,
    actorType: 'super_admin',
    action: 'org.member_removed_admin',
    targetType: 'user',
    targetId: userId,
    reason,
  });
}

export async function lockUser(
  pool: Pool,
  adapter: ServerModuleAdapter,
  {
    userId,
    superAdminUserId,
    reason,
  }: { userId: number; superAdminUserId: number; reason: string }
): Promise<void> {
  await pool.query(
    `INSERT INTO tm_user_locks (user_id, locked_by, reason, locked_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE SET locked_by = EXCLUDED.locked_by,
       reason = EXCLUDED.reason, locked_at = EXCLUDED.locked_at, unlocked_at = NULL`,
    [userId, superAdminUserId, reason]
  );

  await adapter.invalidateAllUserSessions(userId);

  await writeAuditEvent({
    pool,
    orgId: null,
    actorUserId: superAdminUserId,
    actorType: 'super_admin',
    action: 'user.locked',
    targetType: 'user',
    targetId: userId,
    reason,
  });
}

export async function unlockUser(
  pool: Pool,
  adapter: ServerModuleAdapter,
  {
    userId,
    superAdminUserId,
    reason,
  }: { userId: number; superAdminUserId: number; reason: string }
): Promise<void> {
  await pool.query(
    `UPDATE tm_user_locks SET unlocked_at = NOW() WHERE user_id = $1 AND unlocked_at IS NULL`,
    [userId]
  );

  await writeAuditEvent({
    pool,
    orgId: null,
    actorUserId: superAdminUserId,
    actorType: 'super_admin',
    action: 'user.unlocked',
    targetType: 'user',
    targetId: userId,
    reason,
  });
}

export async function triggerPasswordReset(
  pool: Pool,
  adapter: ServerModuleAdapter,
  {
    userId,
    superAdminUserId,
    reason,
    baseUrl,
  }: { userId: number; superAdminUserId: number; reason: string; baseUrl: string }
): Promise<void> {
  const user = await adapter.getUserById(userId);
  if (!user) throw new Error('User not found');

  await requestPasswordReset(pool, adapter, {
    email: user.email,
    baseUrl,
    triggeredBySuperAdmin: true,
  });

  await writeAuditEvent({
    pool,
    orgId: null,
    actorUserId: superAdminUserId,
    actorType: 'super_admin',
    action: 'user.password_reset_triggered',
    targetType: 'user',
    targetId: userId,
    reason,
  });
}

export async function seedSuperAdmin(
  pool: Pool,
  adapter: ServerModuleAdapter,
  email: string
): Promise<void> {
  const user = await adapter.findUserByEmail(email);
  if (!user) {
    // User not found — skip silently (idempotent)
    return;
  }

  await pool.query(
    `INSERT INTO tm_super_admins (user_id, granted_at)
     VALUES ($1, NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id]
  );
}
