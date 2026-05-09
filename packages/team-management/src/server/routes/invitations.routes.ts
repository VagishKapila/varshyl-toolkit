import { Router } from 'express';
import type { Pool } from 'pg';
import type { ServerModuleAdapter, TeamManagementFeatureFlags, OrgRole } from '../types.js';
import { requireMembership, type AuthenticatedRequest } from '../middleware/require-membership.js';
import { requireRole } from '../middleware/require-role.js';
import {
  createInvitation,
  revokeInvitation,
  resendInvitation,
  listPendingInvitations,
  getInvitationWithDecryptedCode,
  acceptInvitationByToken,
  acceptInvitationByCode,
} from '../services/invitations.service.js';
import { writeAuditEvent, getClientIp } from '../services/audit.service.js';

export function createInvitationsRouter(
  pool: Pool,
  adapter: ServerModuleAdapter,
  flags: TeamManagementFeatureFlags,
  baseUrl: string
): Router {
  const router = Router({ mergeParams: true });

  function featureCheck(res: import('express').Response): boolean {
    if (!flags.enableInvites) {
      res.status(501).json({ error: 'Invitations feature is not enabled' });
      return false;
    }
    return true;
  }

  const authMiddleware = requireMembership(pool, adapter);

  // GET /orgs/:orgId/invitations — list pending (admin+)
  router.get('/:orgId/invitations', authMiddleware, requireRole('admin'), async (req, res) => {
    if (!featureCheck(res)) return;
    const { orgId } = req as AuthenticatedRequest;
    try {
      const invitations = await listPendingInvitations(pool, orgId);
      res.json({ invitations });
    } catch (e) {
      adapter.logger.error('[invitations] GET list', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to fetch invitations' });
    }
  });

  // POST /orgs/:orgId/invitations — create (admin+)
  router.post('/:orgId/invitations', authMiddleware, requireRole('admin'), async (req, res) => {
    if (!featureCheck(res)) return;
    const { orgId, userId } = req as AuthenticatedRequest;
    const { email, role } = req.body as { email?: string; role?: string };

    if (!email || !role) {
      res.status(400).json({ error: 'email and role are required' });
      return;
    }

    try {
      const { invitation } = await createInvitation(pool, adapter, {
        orgId,
        invitedByUserId: userId,
        email,
        role: role as OrgRole,
        baseUrl,
      });

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId,
          actorUserId: userId,
          action: 'org.invitation_sent',
          targetType: 'invitation',
          targetId: invitation.id,
          after: { email, role },
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      res.status(201).json({ invitation });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[invitations] POST create', { error: msg });
      if (msg.includes('already exists')) {
        res.status(409).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to create invitation' });
      }
    }
  });

  // DELETE /orgs/:orgId/invitations/:id — revoke (admin+)
  router.delete('/:orgId/invitations/:id', authMiddleware, requireRole('admin'), async (req, res) => {
    if (!featureCheck(res)) return;
    const { orgId, userId } = req as AuthenticatedRequest;
    const invitationId = parseInt(req.params.id, 10);
    if (isNaN(invitationId)) {
      res.status(400).json({ error: 'Invalid invitation ID' });
      return;
    }
    try {
      await revokeInvitation(pool, { invitationId, revokedByUserId: userId });

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId,
          actorUserId: userId,
          action: 'org.invitation_revoked',
          targetType: 'invitation',
          targetId: invitationId,
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      res.json({ message: 'Invitation revoked' });
    } catch (e) {
      adapter.logger.error('[invitations] DELETE revoke', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to revoke invitation' });
    }
  });

  // POST /orgs/:orgId/invitations/:id/resend — resend (admin+)
  router.post('/:orgId/invitations/:id/resend', authMiddleware, requireRole('admin'), async (req, res) => {
    if (!featureCheck(res)) return;
    const { orgId, userId } = req as AuthenticatedRequest;
    const invitationId = parseInt(req.params.id, 10);
    if (isNaN(invitationId)) {
      res.status(400).json({ error: 'Invalid invitation ID' });
      return;
    }
    try {
      await resendInvitation(pool, adapter, { invitationId, baseUrl });

      if (flags.enableAuditLog) {
        await writeAuditEvent({
          pool,
          orgId,
          actorUserId: userId,
          action: 'org.invitation_resent',
          targetType: 'invitation',
          targetId: invitationId,
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] ?? null,
        });
      }

      res.json({ message: 'Invitation resent' });
    } catch (e) {
      adapter.logger.error('[invitations] POST resend', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to resend invitation' });
    }
  });

  // GET /orgs/:orgId/invitations/:id/code — get decrypted code (admin+, phone fallback)
  router.get('/:orgId/invitations/:id/code', authMiddleware, requireRole('admin'), async (req, res) => {
    if (!featureCheck(res)) return;
    const invitationId = parseInt(req.params.id, 10);
    if (isNaN(invitationId)) {
      res.status(400).json({ error: 'Invalid invitation ID' });
      return;
    }
    try {
      const result = await getInvitationWithDecryptedCode(pool, invitationId);
      res.json({ code: result.code, expiresAt: result.expires_at });
    } catch (e) {
      adapter.logger.error('[invitations] GET code', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to retrieve invitation code' });
    }
  });

  // POST /invitations/accept/token — public, no auth
  router.post('/accept/token', async (req, res) => {
    if (!featureCheck(res)) return;
    const { token } = req.body as { token?: string };
    if (!token) {
      res.status(400).json({ error: 'token is required' });
      return;
    }
    try {
      const result = await acceptInvitationByToken(pool, adapter, { token });
      res.json({ message: 'Invitation accepted', orgId: result.orgId, role: result.role });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[invitations] POST accept/token', { error: msg });
      if (msg.includes('not found') || msg.includes('expired') || msg.includes('used')) {
        res.status(404).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to accept invitation' });
      }
    }
  });

  // POST /invitations/accept/code — public, no auth
  router.post('/accept/code', async (req, res) => {
    if (!featureCheck(res)) return;
    const { email, code } = req.body as { email?: string; code?: string };
    if (!email || !code) {
      res.status(400).json({ error: 'email and code are required' });
      return;
    }
    try {
      const result = await acceptInvitationByCode(pool, adapter, { email, code });
      res.json({ message: 'Invitation accepted', orgId: result.orgId, role: result.role });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[invitations] POST accept/code', { error: msg });
      if (msg.includes('not found') || msg.includes('Invalid')) {
        res.status(404).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to accept invitation' });
      }
    }
  });

  return router;
}

