// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import type { KeyLike } from 'jose';
import type { createLocalJWKSet } from 'jose';

const joseCtx = vi.hoisted(() => ({
  privateKey: undefined as KeyLike | undefined,
  localJwks: undefined as ReturnType<typeof createLocalJWKSet> | undefined,
}));

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  const { generateKeyPair, exportJWK, createLocalJWKSet } = actual;
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  joseCtx.privateKey = privateKey;
  const jwk = await exportJWK(publicKey);
  jwk.alg = 'RS256';
  joseCtx.localJwks = createLocalJWKSet({ keys: [jwk] });
  return {
    ...actual,
    createRemoteJWKSet: vi.fn(() => joseCtx.localJwks!),
  };
});

import { SignJWT } from 'jose';
import { verifyAppleIdToken } from '../../src/server/token-verify.js';

const APPLE_AUDIENCES = ['com.varshyl.jobsiteintel', 'com.varshyl.jobsiteintel.signin'];

async function signAppleToken(aud: string): Promise<string> {
  return new SignJWT({ sub: 'user123', email: 'test@example.com' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer('https://appleid.apple.com')
    .setAudience(aud)
    .setExpirationTime('1h')
    .sign(joseCtx.privateKey!);
}

describe('verifyAppleIdToken', () => {
  it('verifies token whose aud matches the SECOND entry in an array', async () => {
    const token = await signAppleToken('com.varshyl.jobsiteintel.signin');
    const result = await verifyAppleIdToken(token, APPLE_AUDIENCES);
    expect(result.subject).toBe('user123');
    expect(result.email).toBe('test@example.com');
  });

  it('rejects token whose aud does not match any entry in array', async () => {
    const token = await signAppleToken('com.varshyl.other');
    await expect(verifyAppleIdToken(token, APPLE_AUDIENCES)).rejects.toThrow();
  });
});
