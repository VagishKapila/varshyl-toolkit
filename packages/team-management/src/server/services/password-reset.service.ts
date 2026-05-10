import type { Pool } from 'pg';
import type { TmPasswordResetRequest, ServerModuleAdapter } from '../types.js';
import { generateToken, sha256 } from '../crypto.js';
import { writeAuditEvent } from './audit.service.js';

const RESET_EXPIRY_HOURS = 2;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

export async function requestPasswordReset(
  pool: Pool,
  adapter: ServerModuleAdapter,
  {
    email,
    baseUrl,
    triggeredBySuperAdmin: _triggeredBySuperAdmin = false,
  }: { email: string; baseUrl: string; triggeredBySuperAdmin?: boolean }
): Promise<void> {
  // Always return success — do not leak whether email exists
  const user = await adapter.findUserByEmail(email);
  if (!user) return;

  // Rate limit: 3 requests per email per hour
  const rateCheck = await pool.query(
    `SELECT COUNT(*) FROM tm_password_reset_requests
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${RATE_LIMIT_WINDOW_HOURS} hours'
       AND used_at IS NULL`,
    [user.id]
  );
  const count = parseInt(rateCheck.rows[0].count, 10);
  if (count >= RATE_LIMIT_MAX) {
    // Silently return — don't reveal rate limit to potential attackers
    return;
  }

  const token = generateToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO tm_password_reset_requests (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await adapter.sendPasswordResetEmail({ to: email, resetUrl });
}

export async function resetPassword(
  pool: Pool,
  adapter: ServerModuleAdapter,
  { token, newPassword }: { token: string; newPassword: string }
): Promise<void> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const tokenHash = sha256(token);

  const result = await pool.query<TmPasswordResetRequest>(
    `SELECT * FROM tm_password_reset_requests
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  if (result.rows.length === 0) {
    throw new Error('Invalid or expired password reset token');
  }

  const request = result.rows[0];
  const hashedPassword = await adapter.hashPassword(newPassword);

  await adapter.setUserPassword(request.user_id, hashedPassword);

  // Mark token as used
  await pool.query(
    `UPDATE tm_password_reset_requests SET used_at = NOW() WHERE id = $1`,
    [request.id]
  );

  // Invalidate all sessions for security
  await adapter.invalidateAllUserSessions(request.user_id);

  await writeAuditEvent({
    pool,
    orgId: null,
    actorUserId: request.user_id,
    action: 'user.password_reset',
    targetType: 'user',
    targetId: request.user_id,
  });
}

