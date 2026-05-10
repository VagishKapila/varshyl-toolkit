import { Router } from 'express';
import type { Pool } from 'pg';
import type { ServerModuleAdapter, TeamManagementFeatureFlags } from '../types.js';
import { requireMembership, type AuthenticatedRequest } from '../middleware/require-membership.js';
import { requireRole } from '../middleware/require-role.js';

const SUPER_ADMIN_DISPLAY_NAME = 'Varshyl Support';
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 200;

export function createAuditRouter(
  pool: Pool,
  adapter: ServerModuleAdapter,
  flags: TeamManagementFeatureFlags
): Router {
  const router = Router({ mergeParams: true });
  const authMiddleware = requireMembership(pool, adapter);

  // GET /orgs/:orgId/audit — paginated audit log (admin+)
  router.get('/:orgId/audit', authMiddleware, requireRole('admin'), async (req, res) => {
    if (!flags.enableAuditLog) {
      res.status(501).json({ error: 'Audit log is not enabled' });
      return;
    }

    const { orgId } = req as AuthenticatedRequest;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const rawLimit = parseInt(req.query.limit as string, 10) || DEFAULT_PAGE_LIMIT;
    const limit = Math.min(rawLimit, MAX_PAGE_LIMIT);
    const offset = (page - 1) * limit;
    const action = req.query.action as string | undefined;

    try {
      const params: unknown[] = [orgId, limit, offset];
      let actionFilter = '';
      if (action) {
        params.push(action);
        actionFilter = `AND ae.action = $${params.length}`;
      }

      const result = await pool.query(
        `SELECT ae.*, sa.user_id AS is_super_admin_actor
         FROM tm_audit_events ae
         LEFT JOIN tm_super_admins sa ON sa.user_id = ae.actor_user_id AND sa.revoked_at IS NULL
         WHERE ae.org_id = $1
         ${actionFilter}
         ORDER BY ae.created_at DESC
         LIMIT $2 OFFSET $3`,
        params
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM tm_audit_events WHERE org_id = $1 ${action ? 'AND action = $2' : ''}`,
        action ? [orgId, action] : [orgId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Collect user IDs for enrichment (non-super-admin actors)
      const userIds = [
        ...new Set(
          result.rows
            .filter(r => r.actor_user_id && !r.is_super_admin_actor)
            .map(r => r.actor_user_id as number)
        ),
      ];
      const users = userIds.length > 0 ? await adapter.getUsersByIds(userIds) : [];
      const userMap = new Map(users.map(u => [u.id, u]));

      const events = result.rows.map(row => {
        const { is_super_admin_actor, ...event } = row;
        const actorDisplay = is_super_admin_actor
          ? { id: row.actor_user_id, name: SUPER_ADMIN_DISPLAY_NAME, email: null }
          : userMap.get(row.actor_user_id) ?? { id: row.actor_user_id, name: null, email: null };
        return { ...event, actor: actorDisplay };
      });

      res.json({
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (e) {
      adapter.logger.error('[audit] GET /:orgId/audit', { error: (e as Error).message });
      res.status(500).json({ error: 'Failed to fetch audit log' });
    }
  });

  return router;
}
