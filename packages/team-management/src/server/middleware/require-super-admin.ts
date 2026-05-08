import type { Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';
import type { ServerModuleAdapter, TeamManagementFeatureFlags } from '../types.js';

export function requireSuperAdmin(pool: Pool, adapter: ServerModuleAdapter, flags: TeamManagementFeatureFlags) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!flags.enableSuperAdmin) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    try {
      const userId = await adapter.getCurrentUserId(req);
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const result = await pool.query(
        `SELECT user_id FROM tm_super_admins WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
      );
      if (result.rows.length === 0) {
        res.status(403).json({ error: 'Super-admin access required' });
        return;
      }
      (req as Request & { superAdminUserId: number }).superAdminUserId = userId;
      next();
    } catch (e) {
      adapter.logger.error('[requireSuperAdmin]', { error: (e as Error).message });
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}
