import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { Request } from 'express';
import type { ServerModuleAdapter, OrgRole } from '@varshyl/team-management';

// ── In-memory user store ───────────────────────────────────────────────────────

interface DemoUser {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
}

const DEMO_USERS: DemoUser[] = [
  { id: 1, email: 'sarah@demo.varshyl.com', name: 'Sarah Chen', passwordHash: '' },
  { id: 2, email: 'mike@demo.varshyl.com', name: 'Mike Torres', passwordHash: '' },
  { id: 3, email: 'jane@demo.varshyl.com', name: 'Jane Williams', passwordHash: '' },
  { id: 4, email: 'tom@demo.varshyl.com', name: 'Tom Nakamura', passwordHash: '' },
  { id: 5, email: 'alex@demo.varshyl.com', name: 'Alex Rivera', passwordHash: '' },
];

// Eagerly hash demo password on startup
(async () => {
  const hash = await bcrypt.hash('demo1234', 10);
  for (const u of DEMO_USERS) u.passwordHash = hash;
  console.log('[adapter] Demo users password-hashed ✓');
})();

// ── Session store ──────────────────────────────────────────────────────────────

const sessions = new Map<string, number>(); // sessionId → userId

function parseTmSession(req: Request): string | null {
  const raw = req.headers.cookie ?? '';
  const m = /(?:^|;\s*)tm_session=([^;]+)/.exec(raw);
  return m ? decodeURIComponent(m[1]) : null;
}

export function createDemoSession(userId: number): string {
  const sid = crypto.randomBytes(32).toString('hex');
  sessions.set(sid, userId);
  return sid;
}

export function destroyDemoSession(sid: string): void {
  sessions.delete(sid);
}

export function getDemoUserById(userId: number): DemoUser | undefined {
  return DEMO_USERS.find(u => u.id === userId);
}

export function listDemoUsers(): Array<{ id: number; name: string; email: string }> {
  return DEMO_USERS.map(u => ({ id: u.id, name: u.name, email: u.email }));
}

// ── Adapter ────────────────────────────────────────────────────────────────────

export const demoAdapter: ServerModuleAdapter = {

  // ── Auth ───────────────────────────────────────────────────────────────────

  getCurrentUserId: async (req: Request) => {
    const sid = parseTmSession(req);
    if (!sid) return null;
    return sessions.get(sid) ?? null;
  },

  getOrganizationIdForUser: async (userId: number) => {
    // Users 1–4 are in "Demo Construction Co." (org seeded at boot)
    // User 5 (Alex) is unaffiliated
    return userId >= 1 && userId <= 4 ? 1 : null;
  },

  isUserOrgAdmin: async (userId: number, _orgId: number) => {
    return userId === 1 || userId === 2; // Sarah (owner) + Mike (admin)
  },

  // ── Logging ────────────────────────────────────────────────────────────────

  logger: {
    info: (msg, meta) => console.log('[team-management]', msg, ...(meta ? [meta] : [])),
    warn: (msg, meta) => console.warn('[team-management:warn]', msg, ...(meta ? [meta] : [])),
    error: (msg, meta) => console.error('[team-management:error]', msg, ...(meta ? [meta] : [])),
  },

  // ── User lookups ───────────────────────────────────────────────────────────

  getUserById: async (userId) => {
    const u = DEMO_USERS.find(u => u.id === userId);
    return u ? { id: u.id, email: u.email, name: u.name } : null;
  },

  getUsersByIds: async (userIds) =>
    DEMO_USERS
      .filter(u => userIds.includes(u.id))
      .map(u => ({ id: u.id, email: u.email, name: u.name })),

  findUserByEmail: async (email) => {
    const u = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    return u ? { id: u.id, email: u.email } : null;
  },

  createUserFromInvite: async ({ email }: { email: string; orgId: number; role: OrgRole }) => {
    const existing = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return { id: existing.id, email: existing.email };
    const hash = await bcrypt.hash('demo1234', 10);
    const newUser: DemoUser = {
      id: DEMO_USERS.length + 1,
      email,
      name: email.split('@')[0] ?? email,
      passwordHash: hash,
    };
    DEMO_USERS.push(newUser);
    console.log(`[adapter] Created demo user id=${newUser.id} email=${email}`);
    return { id: newUser.id, email: newUser.email };
  },

  // ── Password ───────────────────────────────────────────────────────────────

  setUserPassword: async (userId, passwordHash) => {
    const u = DEMO_USERS.find(u => u.id === userId);
    if (u) u.passwordHash = passwordHash;
  },

  hashPassword: async (plaintext) => bcrypt.hash(plaintext, 10),

  verifyPassword: async (plaintext, hash) => bcrypt.compare(plaintext, hash),

  invalidateAllUserSessions: async (userId) => {
    for (const [sid, uid] of sessions.entries()) {
      if (uid === userId) sessions.delete(sid);
    }
  },

  // ── Email (demo: structured console logs with full URLs) ───────────────────

  sendInviteEmail: async ({ to, orgName, inviterName, role, magicLinkUrl, code }) => {
    console.log(`\n[email:invite] ${'─'.repeat(48)}`);
    console.log(`[email:invite] TO:       ${to}`);
    console.log(`[email:invite] Org:      ${orgName}  |  Inviter: ${inviterName}  |  Role: ${role}`);
    console.log(`[email:invite] Link:     ${magicLinkUrl}`);
    console.log(`[email:invite] Code:     ${code}`);
    console.log(`[email:invite] ${'─'.repeat(48)}\n`);
  },

  sendOwnershipTransferEmail: async ({ to, orgName, fromName, transferUrl }) => {
    console.log(`\n[email:transfer] ${'─'.repeat(46)}`);
    console.log(`[email:transfer] TO:     ${to}`);
    console.log(`[email:transfer] Org:    ${orgName}  |  From: ${fromName}`);
    console.log(`[email:transfer] URL:    ${transferUrl}`);
    console.log(`[email:transfer] ${'─'.repeat(46)}\n`);
  },

  sendEmailChangeVerification: async ({ to, verifyUrl }) => {
    console.log(`\n[email:email-change:verify] ${'─'.repeat(35)}`);
    console.log(`[email:email-change:verify] TO:   ${to}`);
    console.log(`[email:email-change:verify] URL:  ${verifyUrl}`);
    console.log(`[email:email-change:verify] ${'─'.repeat(35)}\n`);
  },

  sendEmailChangeOldNotice: async ({ to, newEmail, cancelUrl }) => {
    console.log(`\n[email:email-change:notice] ${'─'.repeat(35)}`);
    console.log(`[email:email-change:notice] TO:      ${to}`);
    console.log(`[email:email-change:notice] NewEmail: ${newEmail}`);
    console.log(`[email:email-change:notice] Cancel:  ${cancelUrl}`);
    console.log(`[email:email-change:notice] ${'─'.repeat(35)}\n`);
  },

  sendEmailChangedFinalNotice: async ({ to, oldEmail, newEmail }) => {
    console.log(`\n[email:email-change:final] ${'─'.repeat(36)}`);
    console.log(`[email:email-change:final] TO:  ${to}`);
    console.log(`[email:email-change:final] ${oldEmail} → ${newEmail}`);
    console.log(`[email:email-change:final] ${'─'.repeat(36)}\n`);
  },

  sendPasswordResetEmail: async ({ to, resetUrl }) => {
    console.log(`\n[email:password-reset] ${'─'.repeat(40)}`);
    console.log(`[email:password-reset] TO:   ${to}`);
    console.log(`[email:password-reset] URL:  ${resetUrl}`);
    console.log(`[email:password-reset] ${'─'.repeat(40)}\n`);
  },

  sendOrgDeletionNotice: async ({ to, orgName, scheduledFor }) => {
    console.log(`\n[email:org-deletion] ${'─'.repeat(42)}`);
    console.log(`[email:org-deletion] TO:        ${to}`);
    console.log(`[email:org-deletion] Org:       ${orgName}`);
    console.log(`[email:org-deletion] Scheduled: ${scheduledFor.toISOString()}`);
    console.log(`[email:org-deletion] ${'─'.repeat(42)}\n`);
  },

  emitNotification: async ({ userId, type, payload }) => {
    console.log(`[notification] userId=${userId} type=${type}`, JSON.stringify(payload));
  },
};
