import { Router } from 'express';
import type { Pool } from 'pg';
import type { ServerModuleAdapter, TeamManagementFeatureFlags } from '../types.js';
import { requireSuperAdmin } from '../middleware/require-super-admin.js';
import {
  listAllOrgs,
  getOrgForAdmin,
  getUserForAdmin,
  restoreOrg,
  appointOwner,
  hardDeleteOrg,
  addMemberAdmin,
  removeMemberAdmin,
  lockUser,
  unlockUser,
  triggerPasswordReset,
} from '../services/super-admin.service.js';

export function createAdminRouter(
  pool: Pool,
  adapter: ServerModuleAdapter,
  flags: TeamManagementFeatureFlags,
  baseUrl: string
): Router {
  const router = Router();
  const superAdminMiddleware = requireSuperAdmin(pool, adapter, flags);

  type SARequest = import('express').Request & { superAdminUserId: number };

  // GET /admin/orgs
  router.get('/orgs', superAdminMiddleware, async (req, res) => {
    try {
      const orgs = await listAllOrgs(pool);
      res.json({ orgs });
    } catch (e) {
      adapter.logger.error('[admin] GET /orgs', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to list organizations' });
    }
  });

  // GET /admin/orgs/:id
  router.get('/orgs/:id', superAdminMiddleware, async (req, res) => {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: 'Invalid org ID' }); return; }
    try {
      const org = await getOrgForAdmin(pool, orgId);
      res.json({ org });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[admin] GET /orgs/:id', { error: msg });
      if (msg.includes('not found')) { res.status(404).json({ error: msg }); }
      else { res.status(500).json({ error: 'Failed to fetch organization' }); }
    }
  });

  // GET /admin/users/:id
  router.get('/users/:id', superAdminMiddleware, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) { res.status(400).json({ error: 'Invalid user ID' }); return; }
    try {
      const user = await getUserForAdmin(pool, adapter, userId);
      res.json({ user });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[admin] GET /users/:id', { error: msg });
      if (msg.includes('not found')) { res.status(404).json({ error: msg }); }
      else { res.status(500).json({ error: 'Failed to fetch user' }); }
    }
  });

  // POST /admin/orgs/:id/restore
  router.post('/orgs/:id/restore', superAdminMiddleware, async (req, res) => {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: 'Invalid org ID' }); return; }
    const { reason } = req.body as { reason?: string };
    if (!reason) { res.status(400).json({ error: 'reason is required' }); return; }
    const saUserId = (req as SARequest).superAdminUserId;
    try {
      await restoreOrg(pool, { orgId, superAdminUserId: saUserId, reason });
      res.json({ message: 'Organization restored' });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[admin] POST /orgs/:id/restore', { error: msg });
      if (msg.includes('not found') || msg.includes('not deleted')) { res.status(404).json({ error: msg }); }
      else { res.status(500).json({ error: 'Failed to restore organization' }); }
    }
  });

  // POST /admin/orgs/:id/appoint-owner
  router.post('/orgs/:id/appoint-owner', superAdminMiddleware, async (req, res) => {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: 'Invalid org ID' }); return; }
    const { targetUserId, reason } = req.body as { targetUserId?: number; reason?: string };
    if (!targetUserId || !reason) { res.status(400).json({ error: 'targetUserId and reason are required' }); return; }
    const saUserId = (req as SARequest).superAdminUserId;
    try {
      await appointOwner(pool, { orgId, targetUserId, superAdminUserId: saUserId, reason });
      res.json({ message: 'Owner appointed' });
    } catch (e) {
      adapter.logger.error('[admin] POST /orgs/:id/appoint-owner', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to appoint owner' });
    }
  });

  // POST /admin/orgs/:id/hard-delete
  router.post('/orgs/:id/hard-delete', superAdminMiddleware, async (req, res) => {
    if (!flags.enableHardDelete) { res.status(403).json({ error: 'Hard delete is not enabled' }); return; }
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: 'Invalid org ID' }); return; }
    const { legalBasis } = req.body as { legalBasis?: string };
    if (!legalBasis) { res.status(400).json({ error: 'legalBasis is required' }); return; }
    const saUserId = (req as SARequest).superAdminUserId;
    try {
      await hardDeleteOrg(pool, { orgId, superAdminUserId: saUserId, legalBasis });
      res.json({ message: 'Organization permanently deleted' });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[admin] POST /orgs/:id/hard-delete', { error: msg });
      if (msg.includes('legal basis')) { res.status(400).json({ error: msg }); }
      else { res.status(500).json({ error: 'Failed to hard delete organization' }); }
    }
  });

  // POST /admin/orgs/:id/members/add
  router.post('/orgs/:id/members/add', superAdminMiddleware, async (req, res) => {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: 'Invalid org ID' }); return; }
    const { userId, role, reason } = req.body as { userId?: number; role?: string; reason?: string };
    if (!userId || !role || !reason) { res.status(400).json({ error: 'userId, role, and reason are required' }); return; }
    const saUserId = (req as SARequest).superAdminUserId;
    try {
      await addMemberAdmin(pool, { orgId, userId, role: role as any, superAdminUserId: saUserId, reason });
      res.json({ message: 'Member added' });
    } catch (e) {
      adapter.logger.error('[admin] POST /orgs/:id/members/add', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to add member' });
    }
  });

  // POST /admin/orgs/:id/members/remove
  router.post('/orgs/:id/members/remove', superAdminMiddleware, async (req, res) => {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: 'Invalid org ID' }); return; }
    const { userId, reason } = req.body as { userId?: number; reason?: string };
    if (!userId || !reason) { res.status(400).json({ error: 'userId and reason are required' }); return; }
    const saUserId = (req as SARequest).superAdminUserId;
    try {
      await removeMemberAdmin(pool, { orgId, userId, superAdminUserId: saUserId, reason });
      res.json({ message: 'Member removed' });
    } catch (e) {
      adapter.logger.error('[admin] POST /orgs/:id/members/remove', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to remove member' });
    }
  });

  // POST /admin/users/:id/lock
  router.post('/users/:id/lock', superAdminMiddleware, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) { res.status(400).json({ error: 'Invalid user ID' }); return; }
    const { reason } = req.body as { reason?: string };
    if (!reason) { res.status(400).json({ error: 'reason is required' }); return; }
    const saUserId = (req as SARequest).superAdminUserId;
    try {
      await lockUser(pool, adapter, { userId, superAdminUserId: saUserId, reason });
      res.json({ message: 'User locked and sessions invalidated' });
    } catch (e) {
      adapter.logger.error('[admin] POST /users/:id/lock', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to lock user' });
    }
  });

  // POST /admin/users/:id/unlock
  router.post('/users/:id/unlock', superAdminMiddleware, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) { res.status(400).json({ error: 'Invalid user ID' }); return; }
    const { reason } = req.body as { reason?: string };
    if (!reason) { res.status(400).json({ error: 'reason is required' }); return; }
    const saUserId = (req as SARequest).superAdminUserId;
    try {
      await unlockUser(pool, adapter, { userId, superAdminUserId: saUserId, reason });
      res.json({ message: 'User unlocked' });
    } catch (e) {
      adapter.logger.error('[admin] POST /users/:id/unlock', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to unlock user' });
    }
  });

  // POST /admin/users/:id/password-reset
  router.post('/users/:id/password-reset', superAdminMiddleware, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) { res.status(400).json({ error: 'Invalid user ID' }); return; }
    const { reason } = req.body as { reason?: string };
    if (!reason) { res.status(400).json({ error: 'reason is required' }); return; }
    const saUserId = (req as SARequest).superAdminUserId;
    try {
      await triggerPasswordReset(pool, adapter, { userId, superAdminUserId: saUserId, reason, baseUrl });
      res.json({ message: 'Password reset email sent' });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[admin] POST /users/:id/password-reset', { error: msg });
      if (msg.includes('not found')) { res.status(404).json({ error: msg }); }
      else { res.status(500).json({ error: 'Failed to trigger password reset' }); }
    }
  });

  return router;
}
