/**
 * Consent API routes for @varshylinc/onboarding-consent-engine demo.
 * Mounts at /api/consent
 */
import { Router } from 'express';
import type { Pool } from 'pg';
import { createConsentModule } from '@varshylinc/onboarding-consent-engine';

export function createConsentRouter(pool: Pool): Router {
  const router = Router();
  const consent = createConsentModule({ pool });

  /** GET /api/consent/definitions — list all consent definitions */
  router.get('/definitions', async (_req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM oce_consent_definitions ORDER BY required DESC, key',
      );
      res.json(result.rows);
    } catch (err) {
      console.error('[consent] GET /definitions error', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /** POST /api/consent/signup — record signup consents */
  router.post('/signup', async (req, res) => {
    const { userId, consents, ipAddress, userAgent } = req.body as {
      userId: string;
      consents: Array<{ key: string; granted: boolean }>;
      ipAddress?: string;
      userAgent?: string;
    };
    if (!userId || !Array.isArray(consents)) {
      return res.status(400).json({ error: 'userId and consents[] are required' });
    }
    try {
      const records = await consent.recordSignupConsents({ userId, consents, ipAddress, userAgent });
      res.json(records);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('Unknown consent key')) {
        return res.status(400).json({ error: err.message });
      }
      console.error('[consent] POST /signup error', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /** GET /api/consent/status/:userId — current consent status */
  router.get('/status/:userId', async (req, res) => {
    try {
      const statuses = await consent.getCurrentConsents(req.params.userId);
      res.json(statuses);
    } catch (err) {
      console.error('[consent] GET /status error', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /** GET /api/consent/pending/:userId — definitions needing re-consent */
  router.get('/pending/:userId', async (req, res) => {
    try {
      const pending = await consent.needsConsentUpdate(req.params.userId);
      res.json(pending);
    } catch (err) {
      console.error('[consent] GET /pending error', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /** GET /api/consent/audit/:userId — full consent audit trail */
  router.get('/audit/:userId', async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const trail = await consent.getAuditTrail(req.params.userId, limit);
      res.json(trail);
    } catch (err) {
      console.error('[consent] GET /audit error', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
