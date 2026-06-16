import type { Pool } from 'pg';
import type { GrantRecord, PromoCode } from '../types.js';

type Db = Pool;

function mapGrant(row: Record<string, unknown>): GrantRecord {
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

function mapPromo(row: Record<string, unknown>): PromoCode {
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

/** Check DB grant BEFORE RevenueCat. Returns true = skip paywall. */
export async function hasGrantedAccess(
  db: Db,
  userId: string,
  productSlug: string,
): Promise<boolean> {
  const { rows } = await db.query(
    `SELECT 1 FROM mp_granted_access
     WHERE user_id = $1 AND product_slug = $2
       AND revoked_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [userId, productSlug],
  );
  return rows.length > 0;
}

/** Super admin: grant permanent or time-limited access */
export async function grantAccess(
  db: Db,
  input: {
    userId: string;
    productSlug: string;
    grantedBy: string;
    reason?: string | null;
    expiresAt?: Date | null;
  },
): Promise<GrantRecord> {
  const { rows } = await db.query(
    `INSERT INTO mp_granted_access (user_id, product_slug, granted_by, reason, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, product_slug) DO UPDATE SET
       granted_by = EXCLUDED.granted_by,
       reason = EXCLUDED.reason,
       expires_at = EXCLUDED.expires_at,
       revoked_at = NULL,
       created_at = NOW()
     RETURNING *`,
    [
      input.userId,
      input.productSlug,
      input.grantedBy,
      input.reason ?? null,
      input.expiresAt ?? null,
    ],
  );
  return mapGrant(rows[0] as Record<string, unknown>);
}

/** Super admin: revoke a grant */
export async function revokeAccess(
  db: Db,
  userId: string,
  productSlug: string,
): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE mp_granted_access SET revoked_at = NOW()
     WHERE user_id = $1 AND product_slug = $2 AND revoked_at IS NULL`,
    [userId, productSlug],
  );
  return (rowCount ?? 0) > 0;
}

/** Super admin: list all active grants */
export async function listGrants(db: Db, productSlug: string): Promise<GrantRecord[]> {
  const { rows } = await db.query(
    `SELECT * FROM mp_granted_access
     WHERE product_slug = $1
       AND revoked_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC`,
    [productSlug],
  );
  return rows.map((row) => mapGrant(row as Record<string, unknown>));
}

/** Super admin: create a promo code */
export async function createPromoCode(
  db: Db,
  input: {
    code: string;
    productSlug: string;
    createdBy: string;
    maxUses?: number | null;
    expiresAt?: Date | null;
    grantsPermanent?: boolean;
    grantsDays?: number | null;
  },
): Promise<{ id: string; code: string }> {
  const code = input.code.trim().toUpperCase();
  const { rows } = await db.query(
    `INSERT INTO mp_promo_codes
       (code, product_slug, max_uses, expires_at, grants_permanent, grants_days, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, code`,
    [
      code,
      input.productSlug,
      input.maxUses ?? null,
      input.expiresAt ?? null,
      input.grantsPermanent ?? true,
      input.grantsDays ?? null,
      input.createdBy,
    ],
  );
  const row = rows[0] as { id: string; code: string };
  return { id: String(row.id), code: String(row.code) };
}

/** List all promo codes for a product */
export async function listPromoCodes(db: Db, productSlug: string): Promise<PromoCode[]> {
  const { rows } = await db.query(
    `SELECT * FROM mp_promo_codes
     WHERE product_slug = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [productSlug],
  );
  return rows.map((row) => mapPromo(row as Record<string, unknown>));
}

/** User: redeem a promo code */
export async function redeemPromoCode(
  db: Db,
  code: string,
  userId: string,
  productSlug: string,
): Promise<{ success: boolean; reason?: string }> {
  const normalized = code.trim().toUpperCase();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const promoResult = await client.query(
      `SELECT * FROM mp_promo_codes
       WHERE code = $1 AND product_slug = $2 AND revoked_at IS NULL
       FOR UPDATE`,
      [normalized, productSlug],
    );
    if (promoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'invalid_code' };
    }
    const promo = promoResult.rows[0] as Record<string, unknown>;
    if (promo.expires_at && new Date(promo.expires_at as string) <= new Date()) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'code_expired' };
    }
    const uses = Number(promo.uses ?? 0);
    const maxUses = promo.max_uses != null ? Number(promo.max_uses) : null;
    if (maxUses != null && uses >= maxUses) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'code_exhausted' };
    }
    const existing = await client.query(
      `SELECT 1 FROM mp_promo_redemptions WHERE code_id = $1 AND user_id = $2`,
      [promo.id, userId],
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'already_redeemed' };
    }
    await client.query(
      `INSERT INTO mp_promo_redemptions (code_id, user_id) VALUES ($1, $2)`,
      [promo.id, userId],
    );
    await client.query(`UPDATE mp_promo_codes SET uses = uses + 1 WHERE id = $1`, [promo.id]);
    const grantsPermanent = Boolean(promo.grants_permanent);
    const grantsDays = promo.grants_days != null ? Number(promo.grants_days) : null;
    const expiresAt =
      grantsPermanent || grantsDays == null
        ? null
        : new Date(Date.now() + grantsDays * 24 * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO mp_granted_access (user_id, product_slug, granted_by, reason, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, product_slug) DO UPDATE SET
         granted_by = EXCLUDED.granted_by,
         reason = EXCLUDED.reason,
         expires_at = EXCLUDED.expires_at,
         revoked_at = NULL,
         created_at = NOW()`,
      [userId, productSlug, 'promo_code', `Promo: ${normalized}`, expiresAt],
    );
    await client.query('COMMIT');
    return { success: true };
  } catch {
    await client.query('ROLLBACK');
    return { success: false, reason: 'redeem_failed' };
  } finally {
    client.release();
  }
}
