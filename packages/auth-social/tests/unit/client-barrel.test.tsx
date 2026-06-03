/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import React from 'react';
import * as Client from '@varshylinc/auth-social/client';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';
import type { AuthActions } from '@varshylinc/auth-social/client';

const mockActions: AuthActions = {
  signInWithEmail: async () => ({ ok: true }),
  signUpWithEmail: async () => ({ ok: true }),
  signInWithApple: async () => ({ ok: true }),
  signInWithGoogle: async () => ({ ok: true }),
  requestPasswordReset: async () => ({ ok: true }),
  resetPassword: async () => ({ ok: true }),
  signOut: async () => ({ ok: true }),
};

afterEach(() => {
  cleanup();
});

describe('@varshylinc/auth-social/client barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Client, 'configureAuth', 'function');
    expectNamedExport(Client, 'useAuth', 'function');
    expectNamedExport(Client, 'authActions', 'const');
    expectNamedExport(Client, 'detectPlatform', 'function');
    expectNamedExport(Client, 'getPlatform', 'function');
    expectNamedExport(Client, 'setPlatformOverride', 'function');
    expectNamedExport(Client, 'AuthThemeProvider', 'function');
    expectNamedExport(Client, 'useAuthTheme', 'function');
    expectNamedExport(Client, 'getAuthTheme', 'function');
    expectNamedExport(Client, 'setAuthTheme', 'function');
    expectNamedExport(Client, 'DEFAULT_AUTH_THEME', 'const');
    expectNamedExport(Client, 'SignInScreen', 'function');
    expectNamedExport(Client, 'ForgotPasswordScreen', 'function');
    expectNamedExport(Client, 'ResetPasswordScreen', 'function');
    expectNamedExport(Client, 'SocialButtons', 'function');
    expectNamedExport(Client, 'AuthDivider', 'function');
    expectNamedExport(Client, 'AuthField', 'function');
    expectNamedExport(Client, 'AppleLogo', 'function');
    expectNamedExport(Client, 'GoogleLogo', 'function');
    expectNamedExport(Client, 'togglePasswordVisibility', 'function');
    expectNamedExport(Client, 'passwordVisibilityAriaLabel', 'function');
    expectNamedExport(Client, 'passwordInputType', 'function');
    expectNamedExport(Client, 'createMockSocialProvider', 'function');
    expectNamedExport(Client, 'MockSocialProvider', 'const');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Client, 'ensureAuthSocialClientStyles');
    expectNotOnBarrel(Client, 'AUTH_SOCIAL_CLIENT_STYLES');
    expectNotOnBarrel(Client, 'createAuthService');
    expectNotOnBarrel(Client, 'runMigrations');
  });

  it('renders exported React components without crashing', () => {
    const onApple = vi.fn();
    const onGoogle = vi.fn();

    render(
      <Client.AuthThemeProvider>
        <Client.AppleLogo />
        <Client.GoogleLogo />
        <Client.AuthDivider />
        <Client.SocialButtons onApple={onApple} onGoogle={onGoogle} />
        <Client.SignInScreen actions={mockActions} />
        <Client.ForgotPasswordScreen actions={mockActions} />
        <Client.ResetPasswordScreen actions={mockActions} token="test-token" />
      </Client.AuthThemeProvider>,
    );

    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });
});
