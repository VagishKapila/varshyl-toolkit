import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { AuthThemeProvider } from '../../src/client/theme.js';
import { SignInScreen } from '../../src/client/components/SignInScreen.js';
import type { AuthActions } from '../../src/types.js';

const noopActions: AuthActions = {
  signInWithEmail: async () => ({ ok: false, error: 'test' }),
  signUpWithEmail: async () => ({ ok: false, error: 'test' }),
  signInWithApple: async () => ({ ok: false, error: 'test' }),
  signInWithGoogle: async () => ({ ok: false, error: 'test' }),
  requestPasswordReset: async () => ({ ok: false, error: 'test' }),
  resetPassword: async () => ({ ok: false, error: 'test' }),
  signOut: async () => ({ ok: true }),
};

afterEach(() => {
  cleanup();
});

describe('AuthThemeProvider', () => {
  it('applies sage primary to submit button on first paint', () => {
    render(
      <AuthThemeProvider theme={{ primary: '#3A6B5F' }}>
        <SignInScreen actions={noopActions} />
      </AuthThemeProvider>,
    );
    const submit = screen.getByTestId('sign-in-submit') as HTMLButtonElement;
    expect(submit.style.background).toBe('rgb(58, 107, 95)');
  });
});
