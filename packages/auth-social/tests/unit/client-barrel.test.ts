import { describe, expect, it } from 'vitest';
import {
  authActions,
  clearSessionToken,
  fetchSession,
  getStoredSessionToken,
  storeSessionToken,
} from '../../src/client.js';

describe('@varshylinc/auth-social/client barrel', () => {
  it('exports session token helpers as functions', () => {
    expect(typeof getStoredSessionToken).toBe('function');
    expect(typeof storeSessionToken).toBe('function');
    expect(typeof clearSessionToken).toBe('function');
    expect(typeof fetchSession).toBe('function');
  });

  it('exports authActions with sign-in helpers', () => {
    expect(typeof authActions.signInWithEmail).toBe('function');
    expect(typeof authActions.signInWithApple).toBe('function');
    expect(typeof authActions.signOut).toBe('function');
  });
});
