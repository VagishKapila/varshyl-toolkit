import type { Pool, PoolClient } from 'pg';
import type { AuditActorType } from '../types.js';

interface WriteAuditEventParams {
  pool: Pool | PoolClient;
  orgId: number | null;
  actorUserId: number | null;
  actorType?: AuditActorType;
  action: string;
  targetType?: string | null;
  targetId?: string | number | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  reason?: string | null;
}

export async function writeAuditEvent(params: WriteAuditEventParams): Promise<void> {
  const {
    pool, orgId, actorUserId, actorType = 'user', action,
    targetType = null, targetId = null, before = null, after = null,
    ip = null, userAgent = null, reason = null,
  } = params;

  await (pool as Pool).query(
    `INSERT INTO tm_audit_events
      (org_id, actor_user_id, actor_type, action, target_type, target_id,
       before_state, after_state, ip, user_agent, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      orgId,
      actorUserId,
      actorType,
      action,
      targetType,
      targetId !== null ? String(targetId) : null,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      ip,
      userAgent,
      reason,
    ]
  );
}

export function getClientIp(req: import('express').Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
}
