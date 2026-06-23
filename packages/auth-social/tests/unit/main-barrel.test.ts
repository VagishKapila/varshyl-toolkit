import { describe, it } from 'vitest';
import * as Main from '@varshylinc/auth-social';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/auth-social main barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Main, 'VERSION', 'const');
    expectNamedExport(Main, 'configureSocialAuth', 'function');
    expectNamedExport(Main, 'createAuthService', 'function');
    expectNamedExport(Main, 'runMigrations', 'function');
    expectNamedExport(Main, 'MIGRATIONS', 'array');
    expectNamedExport(Main, 'MIGRATIONS_DIR', 'const');
    expectNamedExport(Main, 'createAsPool', 'function');
    expectNamedExport(Main, 'asSelfTest', 'function');
    expectNamedExport(Main, 'AsError', 'class');
    expectNamedExport(Main, 'DEFAULT_AS_CONNECTION_TIMEOUT_MS', 'const');
    expectNamedExport(Main, 'DEFAULT_AS_OPERATION_TIMEOUT_MS', 'const');
    expectNamedExport(Main, 'verifyAppleIdToken', 'function');
    expectNamedExport(Main, 'verifyGoogleIdToken', 'function');
    expectNamedExport(Main, 'createMockAuthService', 'function');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Main, 'ensureAuthSocialClientStyles');
    expectNotOnBarrel(Main, 'AUTH_SOCIAL_CLIENT_STYLES');
    expectNotOnBarrel(Main, 'configureAuth');
    expectNotOnBarrel(Main, 'SignInScreen');
  });
});
