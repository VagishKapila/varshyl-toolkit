import type { Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';
import type { ServerModuleAdapter, OrgRole } from '../types.js';

export interface AuthenticatedRequest extends Request {
  userId: number;
  orgId: number;
  userRole: OrgRole;
}

export function requireMembership(pool: Pool, adapter: ServerModuleAdapter) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = await adapter.getCurrentUserId(req);
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const orgIdParam = parseInt(req.params.orgId || req.params.id || '', 10);
      if (isNaN(orgIdParam)) {
        res.status(400).json({ error: 'Invalid org ID' });
        return;
      }

      const result = await pool.query(
        `SELECT m.role FROM tm_memberships m
         JOIN tm_organizations o ON o.id = m.org_id
         WHERE m.org_id = $1 AND m.user_id = $2 AND m.removed_at IS NULL
           AND o.deleted_at IS NULL`,
        [orgIdParam, userId]
      );

      if (result.rows.length === 0) {
        res.status(403).json({ error: 'You are not a member of this organization' });
        return;
      }

      (req as AuthenticatedRequest).userId = userId;
      (req as AuthenticatedRequest).orgId = orgIdParam;
      (req as AuthenticatedRequest).userRole = result.rows[0].role as OrgRole;
      next();
    } catch (e) {
      adapter.logger.error('[requireMembership]', { error: (e as Error).message });
      res.status(500).json({ error: 'Authentication check failed' });
    }
  };
}
