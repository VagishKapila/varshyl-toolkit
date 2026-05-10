import { Router } from 'express';
import type { Pool } from 'pg';
import type { ServerModuleAdapter, TeamManagementFeatureFlags } from '../types.js';
import { requireMembership, type AuthenticatedRequest } from '../middleware/require-membership.js';
import { requireRole } from '../middleware/require-role.js';
import {
  initiateTransfer,
  acceptTransfer,
  cancelTransfer,
  getPendingTransfer,
} from '../services/ownership.service.js';
import { writeAuditEvent, getClientIp } from '../services/audit.service.js';

export function createTransferRouter(
  pool: Pool,
  adapter: ServerModuleAdapter,
  flags: TeamManagementFeatureFlags,
  baseUrl: string
): Router {
  const router = Router({ mergeParams: true });
  const authMiddleware = requireMembership(pool, adapter);

  function featureCheck(res: import('express').Response): boolean {
    if (!flags.enableOwnershipTransfer) {
      res.status(501).json({ error: 'Ownership transfer is not enabled' });
      return false;
    }
    return true;
  }

  router.get('/:orgId/transfer', authMiddleware, async (req, res) => {
    if (!featureCheck(res)) return;
    const { orgId } = req as AuthenticatedRequest;
    try {
      const transfer = await getPendingTransfer(pool, orgId);
      res.json({ transfer });
    } catch (e) {
      adapter.logger.error('[transfer] GET', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to fetch transfer' });
    }
  });

  router.post('/:orgId/transfer', authMiddleware, requireRole('owner'), async (req, res) => {
    if (!featureCheck(res)) return;
    const { orgId, userId } = req as AuthenticatedRequest;
    const { toUserId } = req.body as { toUserId?: number };
    if (!toUserId) { res.status(400).json({ error: 'toUserId is required' }); return; }
    try {
      const transfer = await initiateTransfer(pool, adapter, { orgId, fromUserId: userId, toUserId, baseUrl });
      if (flags.enableAuditLog) {
        await writeAuditEvent({ pool, orgId, actorUserId: userId, action: 'ownership.transfer_initiated',
          targetType: 'user', targetId: toUserId, ip: getClientIp(req), userAgent: req.headers['user-agent'] ?? null });
      }
      res.status(201).json({ transfer });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[transfer] POST initiate', { error: msg });
      if (msg.includes('not a member') || msg.includes('admin') || msg.includes('pending')) {
        res.status(422).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to initiate transfer' });
      }
    }
  });

  router.post('/:orgId/transfer/accept', authMiddleware, async (req, res) => {
    if (!featureCheck(res)) return;
    const { orgId, userId } = req as AuthenticatedRequest;
    try {
      await acceptTransfer(pool, adapter, { orgId, acceptingUserId: userId });
      if (flags.enableAuditLog) {
        await writeAuditEvent({ pool, orgId, actorUserId: userId, action: 'ownership.transfer_accepted',
          targetType: 'org', targetId: orgId, ip: getClientIp(req), userAgent: req.headers['user-agent'] ?? null });
      }
      res.json({ message: 'Ownership transfer accepted. You are now the owner.' });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[transfer] POST accept', { error: msg });
      if (msg.includes('No valid') || msg.includes('Only the designated')) {
        res.status(422).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to accept transfer' });
      }
    }
  });

  router.delete('/:orgId/transfer', authMiddleware, async (req, res) => {
    if (!featureCheck(res)) return;
    const { orgId, userId, userRole } = req as AuthenticatedRequest;
    try {
      const pending = await getPendingTransfer(pool, orgId);
      if (!pending) { res.status(404).json({ error: 'No pending transfer found' }); return; }
      if (userRole !== 'owner' && pending.to_user_id !== userId) {
        res.status(403).json({ error: 'Only the initiating owner or designated recipient can cancel this transfer' });
        return;
      }
      await cancelTransfer(pool, { orgId, cancelledByUserId: userId });
      if (flags.enableAuditLog) {
        await writeAuditEvent({ pool, orgId, actorUserId: userId, action: 'ownership.transfer_cancelled',
          targetType: 'org', targetId: orgId, ip: getClientIp(req), userAgent: req.headers['user-agent'] ?? null });
      }
      res.json({ message: 'Transfer cancelled' });
    } catch (e) {
      adapter.logger.error('[transfer] DELETE cancel', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to cancel transfer' });
    }
  });

  return router;
}
