import { describe, it, expect } from 'vitest';
import { createMockAuthService } from '../../src/server/mock-service.js';

describe('MockAuthService', () => {
  it('signs up, signs in, and verifies session', async () => {
    const auth = createMockAuthService();
    const session = await auth.signUpEmail({
      email: 'test@example.com',
      password: 'secret123',
      name: 'Test',
    });
    expect(session.token).toBeTruthy();

    const verified = await auth.verifySession(session.token);
    expect(verified?.userId).toBe(session.userId);

    await auth.signInEmail({ email: 'test@example.com', password: 'secret123' });
  });

  it('handles password reset flow', async () => {
    const capture = { lastResetToken: null as string | null, lastResetEmail: null as string | null };
    const auth = createMockAuthService(capture);
    await auth.signUpEmail({ email: 'reset@example.com', password: 'oldpass123' });
    await auth.requestPasswordReset('reset@example.com');
    expect(capture.lastResetToken).toBeTruthy();

    await auth.resetPassword({ token: capture.lastResetToken!, newPassword: 'newpass123' });
    const session = await auth.signInEmail({ email: 'reset@example.com', password: 'newpass123' });
    expect(session.userId).toBeTruthy();
  });
});
