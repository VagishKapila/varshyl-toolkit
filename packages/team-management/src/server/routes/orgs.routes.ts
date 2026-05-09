import { Router } from 'express';
import type { Pool } from 'pg';
import type { ServerModuleAdapter, TeamManagementFeatureFlags, OrgRole } from '../types.js';
import { requireMembership, type AuthenticatedRequest } from '../middleware/require-membership.js';
import { requireRole } from '../middleware/require-role.js';
import { getOrg, updateOrg, softDeleteOrg, listOrgMembers } from '../services/organizations.service.js';
import { removeMember, changeRole, validateRoleChange } from '../services/memberships.service.js';
import { writeAuditEvent, getClientIp } from '../services/audit.service.js';

export function createOrgsRouter(
  pool: Pool,
  adapter: ServerModuleAdapter,
  flags: TeamManagementFeatureFlags
): Router {
  const router = Router({ mergeParams: true });
  const authMiddleware = requireMembership(pool, adapter);

  // POST /orgs — create org (any authenticated user)
  router.post('/', async (req, res) => {
    try {
      const userId = await adapter.getCurrentUserId(req as import('express').Request);
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const { name, slug, settings } = req.body as { name?: string; slug?: string; settings?: Record<string, unknown> };
      if (!name || !slug) {
        res.status(400).json({ error: 'name and slug are required' });
        return;
      }

      const result = await pool.query(
        `INSERT INTO tm_organizations (name, slug, owner_user_id, settings)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, slug, userId, JSON.stringify(settings ?? {})]
      );
      const org = result.rows[0];

      await pool.query(
        `INSERT INTO tm_memberships (org_id, user_id, role, joined_at)
         VALUES ($1, $2, 'owner', NOW())`,
        [org.id, userId]
      );

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId: org.id,
          actorUserId: userId,
          action: 'org.created',
          targetType: 'org',
          targetId: org.id,
          after: { name, slug },
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      res.status(201).json({ org });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[orgs] POST /', { error: msg });
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists')) {
        res.status(409).json({ error: 'Organization with that slug already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create organization' });
      }
    }
  });

  // GET /orgs/:orgId — org info (member+)
  router.get('/:orgId', authMiddleware, async (req, res) => {
    const { orgId } = req as AuthenticatedRequest;
    try {
      const org = await getOrg(pool, orgId);
      if (!org) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }
      res.json({ org });
    } catch (e) {
      adapter.logger.error('[orgs] GET /:orgId', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  });

  // PATCH /orgs/:orgId — update name/slug/settings (admin+)
  router.patch('/:orgId', authMiddleware, requireRole('admin'), async (req, res) => {
    const { orgId, userId } = req as AuthenticatedRequest;
    const { name, slug } = req.body as { name?: string; slug?: string };
    try {
      const before = await getOrg(pool, orgId);
      const updated = await updateOrg(pool, orgId, { name, slug });

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId,
          actorUserId: userId,
          action: 'org.settings.updated',
          targetType: 'org',
          targetId: orgId,
          before: { name: before?.name, slug: before?.slug },
          after: { name: updated.name, slug: updated.slug },
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      res.json({ org: updated });
    } catch (e) {
      adapter.logger.error('[orgs] PATCH /:orgId', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to update organization' });
    }
  });

  // DELETE /orgs/:orgId — soft delete (owner only), requires confirmName
  router.delete('/:orgId', authMiddleware, requireRole('owner'), async (req, res) => {
    const { orgId, userId } = req as AuthenticatedRequest;
    // Accept both confirmName and confirmOrgName for compatibility
    const { confirmName, confirmOrgName } = req.body as { confirmName?: string; confirmOrgName?: string };
    const confirm = confirmName ?? confirmOrgName;
    try {
      const org = await getOrg(pool, orgId);
      if (!org) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }
      if (!confirm || confirm !== org.name) {
        res.status(422).json({ error: 'Confirmation name does not match organization name' });
        return;
      }

      await softDeleteOrg(pool, orgId, userId);

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId,
          actorUserId: userId,
          action: 'org.deleted',
          targetType: 'org',
          targetId: orgId,
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      try {
        const members = await listOrgMembers(pool, orgId, { includeRemoved: false });
        const userIds = members.map(m => m.user_id);
        const users = await adapter.getUsersByIds(userIds);
        const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        for (const user of users) {
          await adapter.sendOrgDeletionNotice({
            to: user.email,
            orgName: org.name,
            scheduledFor,
          });
        }
      } catch (e) {
        adapter.logger.warn('[orgs] Failed to send deletion notices', { error: (e as Error).message });
      }

      res.json({ message: 'Organization scheduled for deletion in 30 days' });
    } catch (e) {
      adapter.logger.error('[orgs] DELETE /:orgId', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  });

  // GET /orgs/:orgId/members — list members (member+)
  router.get('/:orgId/members', authMiddleware, async (req, res) => {
    const { orgId } = req as AuthenticatedRequest;
    try {
      const members = await listOrgMembers(pool, orgId);
      const userIds = members.map(m => m.user_id);
      const users = await adapter.getUsersByIds(userIds);
      const userMap = new Map(users.map(u => [u.id, u]));
      const enriched = members.map(m => ({ ...m, user: userMap.get(m.user_id) }));
      res.json({ members: enriched });
    } catch (e) {
      adapter.logger.error('[orgs] GET /:orgId/members', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  });

  // GET /orgs/:orgId/members/former — former members (admin+)
  router.get('/:orgId/members/former', authMiddleware, requireRole('admin'), async (req, res) => {
    const { orgId } = req as AuthenticatedRequest;
    try {
      const allMembers = await listOrgMembers(pool, orgId, { includeRemoved: true });
      const former = allMembers.filter(m => m.removed_at !== null);
      res.json({ members: former });
    } catch (e) {
      adapter.logger.error('[orgs] GET /:orgId/members/former', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to fetch former members' });
    }
  });

  // DELETE /orgs/:orgId/members/:userId — remove member (admin+)
  router.delete('/:orgId/members/:userId', authMiddleware, requireRole('admin'), async (req, res) => {
    const { orgId, userId: actorId, userRole } = req as AuthenticatedRequest;
    const targetUserId = parseInt(req.params.userId, 10);
    const { reason } = req.body as { reason?: string };

    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    if (targetUserId === actorId) {
      res.status(400).json({ message: 'Cannot remove yourself: you are the owner of this organization' });
      return;
    }

    try {
      const targetMemberResult = await pool.query(
        `SELECT role FROM tm_memberships WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
        [orgId, targetUserId]
      );
      if (targetMemberResult.rows.length === 0) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }
      const targetRole = targetMemberResult.rows[0].role;

      if (userRole === 'admin' && (targetRole === 'owner' || targetRole === 'admin')) {
        res.status(403).json({ error: 'Admins cannot remove owners or other admins' });
        return;
      }

      await removeMember(pool, { orgId, userId: targetUserId, removedByUserId: actorId, reason });

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId,
          actorUserId: actorId,
          action: 'member.removed',
          targetType: 'user',
          targetId: targetUserId,
          before: { role: targetRole },
          reason: reason ?? null,
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      res.json({ message: 'Member removed successfully' });
    } catch (e) {
      adapter.logger.error('[orgs] DELETE /:orgId/members/:userId', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to remove member' });
    }
  });

  // PATCH /orgs/:orgId/members/:userId/role — change role (admin+)
  router.patch('/:orgId/members/:userId/role', authMiddleware, requireRole('admin'), async (req, res) => {
    const { orgId, userId: actorId, userRole } = req as AuthenticatedRequest;
    const targetUserId = parseInt(req.params.userId, 10);
    const { role: newRole } = req.body as { role?: string };

    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    if (!newRole) {
      res.status(400).json({ error: 'role is required' });
      return;
    }

    try {
      await validateRoleChange(pool, { orgId, actorRole: userRole, targetUserId, newRole: newRole as OrgRole });
      const before = await pool.query(
        `SELECT role FROM tm_memberships WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
        [orgId, targetUserId]
      );
      const updated = await changeRole(pool, { orgId, userId: targetUserId, newRole: newRole as OrgRole, changedByUserId: actorId });

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId,
          actorUserId: actorId,
          action: 'member.role_changed',
          targetType: 'user',
          targetId: targetUserId,
          before: { role: before.rows[0]?.role },
          after: { role: newRole },
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      res.json({ membership: updated });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[orgs] PATCH /:orgId/members/:userId/role', { error: msg });
      if (msg.includes('Cannot') || msg.includes('Requires') || msg.includes('cannot')) {
        res.status(403).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to change role' });
      }
    }
  });

  // PATCH /orgs/:orgId/members/:userId — alias without /role suffix (for compatibility)
  router.patch('/:orgId/members/:userId', authMiddleware, requireRole('admin'), async (req, res) => {
    const { orgId, userId: actorId, userRole } = req as AuthenticatedRequest;
    const targetUserId = parseInt(req.params.userId, 10);
    const { role: newRole } = req.body as { role?: string };

    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    if (!newRole) {
      res.status(400).json({ error: 'role is required' });
      return;
    }

    try {
      await validateRoleChange(pool, { orgId, actorRole: userRole, targetUserId, newRole: newRole as OrgRole });
      const before = await pool.query(
        `SELECT role FROM tm_memberships WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
        [orgId, targetUserId]
      );
      const updated = await changeRole(pool, { orgId, userId: targetUserId, newRole: newRole as OrgRole, changedByUserId: actorId });

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId,
          actorUserId: actorId,
          action: 'member.role_changed',
          targetType: 'user',
          targetId: targetUserId,
          before: { role: before.rows[0]?.role },
          after: { role: newRole },
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      res.json({ membership: updated });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[orgs] PATCH /:orgId/members/:userId', { error: msg });
      if (msg.includes('Cannot') || msg.includes('Requires') || msg.includes('cannot')) {
        res.status(403).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to change role' });
      }
    }
  });

  return router;
}
