import type { Pool } from 'pg';
import type { AuthConfig } from '../config.js';
import type { Session } from '../types.js';
import type { AuthUserAdapter } from './adapter.js';
import type { AuthService } from './service.js';
import { hashPassword, verifyPassword } from './password.js';
import { createPasswordReset, consumePasswordReset } from './password-reset.js';
import { issueSession, revokeSessionToken, verifySessionToken } from './sessions.js';
import {
  parseMockIdToken,
  verifyAppleIdToken,
  verifyGoogleIdToken,
} from './token-verify.js';

const DEFAULT_TTL_DAYS = 30;

export function createAuthService(
  pool: Pool,
  adapter: AuthUserAdapter,
  config: AuthConfig
): AuthService {
  const ttlDays = config.sessionTtlDays ?? DEFAULT_TTL_DAYS;

  async function resolveOAuthUser(
    provider: 'apple' | 'google',
    idToken: string
  ): Promise<{ userId: string; email: string | null }> {
    const mock = parseMockIdToken(idToken);
    const verified = mock ?? (provider === 'apple'
      ? await verifyAppleIdToken(idToken, config.appleClientId)
      : await verifyGoogleIdToken(idToken, config.googleClientId));

    const existing = await pool.query<{ user_id: string; email: string | null }>(
      `SELECT user_id, email FROM as_oauth_identities
       WHERE provider = $1 AND provider_subject = $2`,
      [provider, verified.subject]
    );

    if (existing.rows.length > 0) {
      return { userId: existing.rows[0].user_id, email: existing.rows[0].email };
    }

    const email = verified.email?.toLowerCase() ?? null;
    let userId: string;

    if (email) {
      const byEmail = await adapter.findUserByEmail(email);
      if (byEmail) {
        userId = byEmail.id;
      } else {
        const created = await adapter.createUser({ email, provider });
        userId = created.id;
      }
    } else {
      const placeholder = `${provider}:${verified.subject}@oauth.local`;
      const created = await adapter.createUser({ email: placeholder, provider });
      userId = created.id;
    }

    await pool.query(
      `INSERT INTO as_oauth_identities (user_id, provider, provider_subject, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (provider, provider_subject) DO NOTHING`,
      [userId, provider, verified.subject, email]
    );

    return { userId, email };
  }

  return {
    async signUpEmail({ email, password, name }): Promise<Session> {
      const normalized = email.trim().toLowerCase();
      const existing = await pool.query(
        `SELECT id FROM as_credentials WHERE email = $1`,
        [normalized]
      );
      if (existing.rows.length > 0) throw new Error('Email already registered');

      const user = await adapter.createUser({ email: normalized, name, provider: 'email' });
      const passwordHash = await hashPassword(password);
      await pool.query(
        `INSERT INTO as_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
        [user.id, normalized, passwordHash]
      );
      return issueSession(pool, user.id, ttlDays);
    },

    async signInEmail({ email, password }): Promise<Session> {
      const normalized = email.trim().toLowerCase();
      const result = await pool.query<{ user_id: string; password_hash: string }>(
        `SELECT user_id, password_hash FROM as_credentials WHERE email = $1`,
        [normalized]
      );
      if (result.rows.length === 0) throw new Error('Invalid email or password');

      const row = result.rows[0];
      const valid = await verifyPassword(password, row.password_hash);
      if (!valid) throw new Error('Invalid email or password');

      return issueSession(pool, row.user_id, ttlDays);
    },

    async signInWithProvider({ provider, idToken }): Promise<Session> {
      const { userId } = await resolveOAuthUser(provider, idToken);
      return issueSession(pool, userId, ttlDays);
    },

    async requestPasswordReset(email) {
      await createPasswordReset(pool, adapter, config, email);
    },

    async resetPassword({ token, newPassword }) {
      await consumePasswordReset(pool, token, newPassword);
    },

    async verifySession(token) {
      return verifySessionToken(pool, token);
    },

    async revokeSession(token) {
      await revokeSessionToken(pool, token);
    },
  };
}
