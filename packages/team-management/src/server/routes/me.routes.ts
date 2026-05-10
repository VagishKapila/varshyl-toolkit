import { Router } from 'express';
import type { Pool } from 'pg';
import type { ServerModuleAdapter, TeamManagementFeatureFlags } from '../types.js';
import { requestEmailChange, verifyEmailChange, cancelEmailChange } from '../services/email-change.service.js';
import { requestPasswordReset, resetPassword } from '../services/password-reset.service.js';
import { getActiveMembership } from '../services/organizations.service.js';
import { sha256 } from '../crypto.js';

export function createMeRouter(
  pool: Pool,
  adapter: ServerModuleAdapter,
  flags: TeamManagementFeatureFlags,
  baseUrl: string
): Router {
  const router = Router();

  router.get('/membership', async (req, res) => {
    try {
      const userId = await adapter.getCurrentUserId(req);
      if (!userId) { res.status(401).json({ error: 'Authentication required' }); return; }
      const orgId = await adapter.getOrganizationIdForUser(userId);
      if (!orgId) { res.status(404).json({ error: 'No organization membership found' }); return; }
      const membership = await getActiveMembership(pool, orgId, userId);
      res.json({ membership });
    } catch (e) {
      adapter.logger.error('[me] GET /membership', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to fetch membership' });
    }
  });

  router.post('/email-change', async (req, res) => {
    if (!flags.enableEmailChange) { res.status(501).json({ error: 'Email change is not enabled' }); return; }
    try {
      const userId = await adapter.getCurrentUserId(req);
      if (!userId) { res.status(401).json({ error: 'Authentication required' }); return; }
      const user = await adapter.getUserById(userId);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      const { newEmail } = req.body as { newEmail?: string };
      if (!newEmail) { res.status(400).json({ error: 'newEmail is required' }); return; }
      await requestEmailChange(pool, adapter, { userId, currentEmail: user.email, newEmail, baseUrl });
      res.json({ message: 'Verification email sent to your new address' });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[me] POST /email-change', { error: msg });
      if (msg.includes('Too many')) {
        res.status(429).json({ error: msg });
      } else if (msg.includes('already in use')) {
        res.status(422).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to request email change' });
      }
    }
  });

  router.get('/email-change/verify', async (req, res) => {
    if (!flags.enableEmailChange) { res.status(501).json({ error: 'Email change is not enabled' }); return; }
    const token = req.query.token as string;
    if (!token) { res.status(400).json({ error: 'token query parameter is required' }); return; }
    try {
      // Token-based verification — no authentication required; token is self-authenticating
      const userId = await adapter.getCurrentUserId(req);
      await verifyEmailChange(pool, adapter, { token, userId: userId ?? null });
      res.json({ message: 'Email address updated successfully' });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[me] GET /email-change/verify', { error: msg });
      if (msg.includes('Invalid') || msg.includes('expired')) {
        res.status(404).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to verify email change' });
      }
    }
  });

  router.get('/email-change/cancel', async (req, res) => {
    if (!flags.enableEmailChange) { res.status(501).json({ error: 'Email change is not enabled' }); return; }
    const token = req.query.token as string;
    if (!token) { res.status(400).json({ error: 'token query parameter is required' }); return; }
    try {
      await cancelEmailChange(pool, adapter, { token });
      res.json({ message: 'Email change cancelled. Your sessions have been invalidated for security.' });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[me] GET /email-change/cancel', { error: msg });
      if (msg.includes('Invalid') || msg.includes('expired')) {
        res.status(404).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to cancel email change' });
      }
    }
  });

  router.post('/password-reset/request', async (req, res) => {
    if (!flags.enablePasswordReset) { res.status(501).json({ error: 'Password reset is not enabled' }); return; }
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: 'email is required' }); return; }
    try {
      await requestPasswordReset(pool, adapter, { email, baseUrl });
      res.json({ message: 'If that email exists, a reset link has been sent' });
    } catch (e) {
      adapter.logger.error('[me] POST /password-reset/request', { error: (e as Error).message });
      res.json({ message: 'If that email exists, a reset link has been sent' });
    }
  });

  router.get('/password-reset', async (req, res) => {
    if (!flags.enablePasswordReset) { res.status(501).json({ error: 'Password reset is not enabled' }); return; }
    const token = req.query.token as string;
    if (!token) { res.status(400).json({ error: 'token query parameter is required' }); return; }
    try {
      const tokenHash = sha256(token);
      const result = await pool.query(
        `SELECT id FROM tm_password_reset_requests WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
        [tokenHash]
      );
      if (result.rows.length === 0) { res.status(404).json({ error: 'Invalid or expired password reset token' }); return; }
      res.json({ valid: true });
    } catch (e) {
      adapter.logger.error('[me] GET /password-reset', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to validate token' });
    }
  });

  router.post('/password-reset', async (req, res) => {
    if (!flags.enablePasswordReset) { res.status(501).json({ error: 'Password reset is not enabled' }); return; }
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) { res.status(400).json({ error: 'token and newPassword are required' }); return; }
    try {
      await resetPassword(pool, adapter, { token, newPassword });
      res.json({ message: 'Password updated successfully. Please log in again.' });
    } catch (e) {
      const msg = (e as Error).message;
      adapter.logger.error('[me] POST /password-reset', { error: msg });
      if (msg.includes('Invalid') || msg.includes('expired') || msg.includes('8 characters')) {
        res.status(422).json({ error: msg });
      } else {
        res.status(500).json({ error: 'Failed to reset password' });
      }
    }
  });

  return router;
}
