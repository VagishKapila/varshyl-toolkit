import { Router } from 'express';
import type { Pool } from 'pg';
import type { TeamManagementConfig } from '../types.js';

const MODULE_VERSION = '0.1.0';

export function createHealthRouter(
  pool: Pool,
  config: TeamManagementConfig
): { router: Router; handler: import('express').RequestHandler } {
  const flags = config.featureFlags ?? {};

  const handler: import('express').RequestHandler = async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        status: 'ok',
        module: '@varshylinc/team-management',
        version: MODULE_VERSION,
        db: 'connected',
        flags: {
          enableInvites: flags.enableInvites ?? true,
          enableAuditLog: flags.enableAuditLog ?? true,
          enableOwnershipTransfer: flags.enableOwnershipTransfer ?? true,
          enableEmailChange: flags.enableEmailChange ?? true,
          enablePasswordReset: flags.enablePasswordReset ?? true,
          enableSuperAdmin: flags.enableSuperAdmin ?? false,
          enableSharedAccess: flags.enableSharedAccess ?? false,
          enableHardDelete: flags.enableHardDelete ?? false,
        },
      });
    } catch (err) {
      res.status(503).json({
        status: 'error',
        module: '@varshylinc/team-management',
        version: MODULE_VERSION,
        db: 'disconnected',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const router = Router();
  router.get('/health', handler);
  return { router, handler };
}
