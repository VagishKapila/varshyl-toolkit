export const VERSION = '0.6.1' as const;

export { configureSocialAuth, getSocialAuthApiBaseUrl } from './config.js';

export {
  createAuthService,
  runMigrations,
  MIGRATIONS,
  MIGRATIONS_DIR,
  createAsPool,
  asSelfTest,
  AsError,
  DEFAULT_AS_CONNECTION_TIMEOUT_MS,
  DEFAULT_AS_OPERATION_TIMEOUT_MS,
  verifyAppleIdToken,
  verifyGoogleIdToken,
  createMockAuthService,
} from './server/index.js';
export type {
  RunMigrationsOptions,
  CreateAsPoolOptions,
  AsSelfTestResult,
  AsSelfTestOptions,
  AsErrorCode,
  MockAuthCapture,
  AuthService,
  AuthUserAdapter,
} from './server/index.js';
export type { AuthConfig } from './config.js';
export type { Session, AuthProvider, OAuthProvider } from './types.js';
