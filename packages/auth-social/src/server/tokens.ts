import crypto from 'crypto';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function sessionExpiresAt(ttlDays: number): Date {
  const ms = ttlDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

export function resetExpiresAt(hours = 1): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
