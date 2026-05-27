import type { Session } from '../types.js';
import type { AuthService } from './service.js';
import { hashPassword, verifyPassword } from './password.js';
import { parseMockIdToken } from './token-verify.js';
import { generateToken, hashToken, resetExpiresAt, sessionExpiresAt } from './tokens.js';

interface MockUser {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
}

interface MockOAuthIdentity {
  provider: 'apple' | 'google';
  subject: string;
  userId: string;
  email: string | null;
}

export interface MockAuthCapture {
  lastResetToken: string | null;
  lastResetEmail: string | null;
}

export function createMockAuthService(capture: MockAuthCapture = { lastResetToken: null, lastResetEmail: null }): AuthService {
  const users = new Map<string, MockUser>();
  const sessions = new Map<string, { userId: string; expiresAt: Date }>();
  const oauth = new Map<string, MockOAuthIdentity>();
  const resetTokens = new Map<string, { userId: string; expiresAt: Date }>();
  let nextId = 1;

  function createUser(email: string, name?: string, _provider: 'email' | 'apple' | 'google' = 'email'): MockUser {
    const id = String(nextId++);
    const user: MockUser = {
      id,
      email: email.toLowerCase(),
      name,
      passwordHash: '',
    };
    users.set(id, user);
    return user;
  }

  async function issue(userId: string): Promise<Session> {
    const token = generateToken();
    const expiresAt = sessionExpiresAt(30);
    sessions.set(hashToken(token), { userId, expiresAt });
    return { token, userId, expiresAt };
  }

  return {
    async signUpEmail({ email, password, name }) {
      const normalized = email.trim().toLowerCase();
      for (const u of users.values()) {
        if (u.email === normalized) throw new Error('Email already registered');
      }
      const user = createUser(normalized, name, 'email');
      user.passwordHash = await hashPassword(password);
      return issue(user.id);
    },

    async signInEmail({ email, password }) {
      const normalized = email.trim().toLowerCase();
      const user = [...users.values()].find(u => u.email === normalized);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw new Error('Invalid email or password');
      }
      return issue(user.id);
    },

    async signInWithProvider({ provider, idToken }) {
      const verified = parseMockIdToken(idToken);
      if (!verified) throw new Error('Mock provider requires mock:idToken format');

      const key = `${provider}:${verified.subject}`;
      const existing = oauth.get(key);
      if (existing) return issue(existing.userId);

      const email = verified.email?.toLowerCase() ?? `${provider}:${verified.subject}@oauth.local`;
      let user = [...users.values()].find(u => u.email === email);
      if (!user) user = createUser(email, undefined, provider);

      oauth.set(key, { provider, subject: verified.subject, userId: user.id, email: verified.email });
      return issue(user.id);
    },

    async requestPasswordReset(email) {
      const normalized = email.trim().toLowerCase();
      const user = [...users.values()].find(u => u.email === normalized);
      if (!user) return;

      const token = generateToken();
      resetTokens.set(hashToken(token), { userId: user.id, expiresAt: resetExpiresAt() });
      capture.lastResetToken = token;
      capture.lastResetEmail = user.email;
    },

    async resetPassword({ token, newPassword }) {
      const entry = resetTokens.get(hashToken(token));
      if (!entry || entry.expiresAt < new Date()) {
        throw new Error('Invalid or expired reset token');
      }
      const user = users.get(entry.userId);
      if (!user) throw new Error('User not found');
      user.passwordHash = await hashPassword(newPassword);
      resetTokens.delete(hashToken(token));
    },

    async verifySession(token) {
      const entry = sessions.get(hashToken(token));
      if (!entry || entry.expiresAt < new Date()) return null;
      return { userId: entry.userId };
    },

    async revokeSession(token) {
      sessions.delete(hashToken(token));
    },
  };
}
