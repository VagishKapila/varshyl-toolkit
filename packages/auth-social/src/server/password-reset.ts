import type { Pool } from 'pg';
import type { AuthUserAdapter } from './adapter.js';
import type { AuthConfig } from '../config.js';
import { hashPassword } from './password.js';
import { generateToken, hashToken, resetExpiresAt } from './tokens.js';

export async function createPasswordReset(
  pool: Pool,
  adapter: AuthUserAdapter,
  config: AuthConfig,
  email: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const user = await adapter.findUserByEmail(normalized);
  if (!user) return;

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = resetExpiresAt();

  await pool.query(
    `INSERT INTO as_password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt.toISOString()]
  );

  const hostUser = await adapter.getUserById(user.id);
  if (!hostUser) return;

  const resetUrl = `${config.resetUrlBase.replace(/\/$/, '')}?token=${encodeURIComponent(token)}`;
  await adapter.sendPasswordResetEmail({ to: hostUser.email, resetUrl });
}

export async function consumePasswordReset(
  pool: Pool,
  token: string,
  newPassword: string
): Promise<void> {
  const tokenHash = hashToken(token);
  const result = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM as_password_resets
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  if (result.rows.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const userId = result.rows[0].user_id;
  const passwordHash = await hashPassword(newPassword);

  await pool.query(
    `UPDATE as_credentials SET password_hash = $1, updated_at = NOW() WHERE user_id = $2`,
    [passwordHash, userId]
  );
  await pool.query(
    `UPDATE as_password_resets SET used_at = NOW() WHERE token_hash = $1`,
    [tokenHash]
  );
}
