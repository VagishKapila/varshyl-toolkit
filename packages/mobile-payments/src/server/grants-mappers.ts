import type { GrantRecord, PromoCode } from '../types.js';

export function mapGrant(row: Record<string, unknown>): GrantRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    productSlug: String(row.product_slug),
    grantedBy: String(row.granted_by),
    reason: row.reason != null ? String(row.reason) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at as string | Date) : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at as string | Date) : null,
    createdAt: new Date(row.created_at as string | Date),
  };
}

export function mapPromo(row: Record<string, unknown>): PromoCode {
  return {
    id: String(row.id),
    code: String(row.code),
    productSlug: String(row.product_slug),
    maxUses: row.max_uses != null ? Number(row.max_uses) : null,
    uses: Number(row.uses ?? 0),
    expiresAt: row.expires_at ? new Date(row.expires_at as string | Date) : null,
    grantsPermanent: Boolean(row.grants_permanent),
    grantsDays: row.grants_days != null ? Number(row.grants_days) : null,
    createdBy: String(row.created_by),
    createdAt: new Date(row.created_at as string | Date),
    revokedAt: row.revoked_at ? new Date(row.revoked_at as string | Date) : null,
  };
}
