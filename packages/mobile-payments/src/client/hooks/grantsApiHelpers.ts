import type { GrantRecord, PromoCode } from '../../types.js';

function parseDate(value: unknown): Date | null {
  if (value == null) return null;
  return new Date(String(value));
}

export function mapGrantRecord(raw: Record<string, unknown>): GrantRecord {
  return {
    id: String(raw.id),
    userId: String(raw.userId ?? raw.user_id),
    productSlug: String(raw.productSlug ?? raw.product_slug),
    grantedBy: String(raw.grantedBy ?? raw.granted_by),
    reason: raw.reason != null ? String(raw.reason) : null,
    expiresAt: parseDate(raw.expiresAt ?? raw.expires_at),
    revokedAt: parseDate(raw.revokedAt ?? raw.revoked_at),
    createdAt: new Date(String(raw.createdAt ?? raw.created_at)),
  };
}

export function mapPromoCode(raw: Record<string, unknown>): PromoCode {
  return {
    id: String(raw.id),
    code: String(raw.code),
    productSlug: String(raw.productSlug ?? raw.product_slug),
    maxUses: raw.maxUses != null || raw.max_uses != null ? Number(raw.maxUses ?? raw.max_uses) : null,
    uses: Number(raw.uses ?? 0),
    expiresAt: parseDate(raw.expiresAt ?? raw.expires_at),
    grantsPermanent: Boolean(raw.grantsPermanent ?? raw.grants_permanent),
    grantsDays: raw.grantsDays != null || raw.grants_days != null ? Number(raw.grantsDays ?? raw.grants_days) : null,
    createdBy: String(raw.createdBy ?? raw.created_by),
    createdAt: new Date(String(raw.createdAt ?? raw.created_at)),
    revokedAt: parseDate(raw.revokedAt ?? raw.revoked_at),
  };
}

export async function readApiJson(
  res: Response,
): Promise<{ success?: boolean; data?: unknown; error?: string }> {
  return (await res.json()) as { success?: boolean; data?: unknown; error?: string };
}
