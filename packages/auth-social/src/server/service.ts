import type { Session } from '../types.js';

export interface AuthService {
  signUpEmail(input: { email: string; password: string; name?: string }): Promise<Session>;
  signInEmail(input: { email: string; password: string }): Promise<Session>;
  signInWithProvider(input: { provider: 'apple' | 'google'; idToken: string }): Promise<Session>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(input: { token: string; newPassword: string }): Promise<void>;
  verifySession(token: string): Promise<{ userId: string } | null>;
  revokeSession(token: string): Promise<void>;
}
