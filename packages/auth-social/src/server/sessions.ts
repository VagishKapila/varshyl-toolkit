import type { Pool } from 'pg';
import type { Session } from '../types.js';
import { generateToken, hashToken, sessionExpiresAt } from './tokens.js';

export async function issueSession(
  pool: Pool,
  userId: string,
  ttlDays: number
): Promise<Session> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = sessionExpiresAt(ttlDays);

  await pool.query(
    `INSERT INTO as_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()]
  );

  return { token, userId, expiresAt };
}

export async function verifySessionToken(
  pool: Pool,
  token: string
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(token);
  const result = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM as_sessions
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [tokenHash]
  );
  if (result.rows.length === 0) return null;
  return { userId: result.rows[0].user_id };
}

export async function revokeSessionToken(pool: Pool, token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await pool.query(
    `UPDATE as_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}
