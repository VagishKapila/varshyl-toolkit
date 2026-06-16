import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { VerifiedIdToken } from '../types.js';

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

function payloadToVerified(payload: JWTPayload): VerifiedIdToken {
  const subject = typeof payload.sub === 'string' ? payload.sub : '';
  if (!subject) throw new Error('Token missing subject');
  const email = typeof payload.email === 'string' ? payload.email : null;
  return { subject, email };
}

export async function verifyAppleIdToken(
  idToken: string,
  clientId?: string | string[]
): Promise<VerifiedIdToken> {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: clientId,
  });
  return payloadToVerified(payload);
}

export async function verifyGoogleIdToken(
  idToken: string,
  clientId?: string | string[]
): Promise<VerifiedIdToken> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId,
  });
  return payloadToVerified(payload);
}

/** Parse mock tokens used in smoke/dev: `mock:provider:subject:email` */
export function parseMockIdToken(idToken: string): VerifiedIdToken | null {
  if (!idToken.startsWith('mock:')) return null;
  const parts = idToken.split(':');
  if (parts.length < 3) return null;
  const subject = parts[2] ?? '';
  const email = parts[3] ?? null;
  if (!subject) return null;
  return { subject, email };
}
