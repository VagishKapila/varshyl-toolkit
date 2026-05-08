import { Router, type RequestHandler } from 'express';
import type { Pool } from 'pg';

export function createHealthRouter(db: Pool): { router: Router; handler: RequestHandler } {
  const handler: RequestHandler = async (_req, res) => {
    try {
      // Verify DB connectivity — simple ping
      await db.query('SELECT 1');
      res.json({
        status: 'ok',
        module: '@varshyl/team-management',
        version: '0.0.1',
        db: 'connected',
      });
    } catch (err) {
      res.status(503).json({
        status: 'error',
        module: '@varshyl/team-management',
        db: 'disconnected',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const router = Router();
  router.get('/health', handler);
  return { router, handler };
}
