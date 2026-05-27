import type { Pool } from 'pg';
import type { AuthConfig } from './config.js';
import { createAuthService } from './server/pg-auth-service.js';
import { runMigrations, MIGRATIONS_DIR } from './server/migrations.js';
import { verifyAppleIdToken, verifyGoogleIdToken } from './server/token-verify.js';

export { createAuthService, runMigrations, MIGRATIONS_DIR };
export { verifyAppleIdToken, verifyGoogleIdToken };
export { createMockAuthService } from './server/mock-service.js';
export type { MockAuthCapture } from './server/mock-service.js';
export type { AuthService } from './server/service.js';
export type { AuthUserAdapter } from './server/adapter.js';
export type { AuthConfig } from './config.js';
export type { Session, AuthProvider, OAuthProvider } from './types.js';
