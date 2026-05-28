import React, { useState } from 'react';
import { AuthField } from './AuthField.js';
import { SocialButtons } from './SocialButtons.js';
import { getAuthTheme } from '../theme.js';
import type { AuthActions } from '../../types.js';

interface SignInScreenProps {
  actions: AuthActions;
  onSuccess?: () => void;
  forgotPasswordUrl?: string;
  signUpMode?: boolean;
  /** Signup-only slot for consent UI (e.g. OCE SignupConsentBlock). Ignored when signUpMode is false. */
  consentSlot?: React.ReactNode;
}

export function SignInScreen({
  actions,
  onSuccess,
  forgotPasswordUrl = '/auth/forgot-password',
  signUpMode = false,
  consentSlot,
}: SignInScreenProps): React.ReactElement {
  const theme = getAuthTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const result = signUpMode
      ? await actions.signUpWithEmail(email, password, name || undefined)
      : await actions.signInWithEmail(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Sign-in failed');
      return;
    }
    onSuccess?.();
  };

  const social = async (provider: 'apple' | 'google') => {
    setLoading(true);
    setError(null);
    const result = provider === 'apple'
      ? await actions.signInWithApple()
      : await actions.signInWithGoogle();
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Social sign-in failed');
      return;
    }
    onSuccess?.();
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '32px 24px',
        fontFamily: 'system-ui, sans-serif',
      }}
      data-testid="sign-in-screen"
    >
      <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: theme.text }}>
        {signUpMode ? 'Create account' : 'Sign in'}
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: '14px', color: theme.textMuted }}>
        {signUpMode ? 'Sign up with email or a social provider.' : 'Welcome back.'}
      </p>

      <SocialButtons
        onApple={() => void social('apple')}
        onGoogle={() => void social('google')}
        loading={loading}
      />

      <div style={{ margin: '20px 0', textAlign: 'center', color: theme.textMuted, fontSize: '12px' }}>
        or continue with email
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {signUpMode && (
          <AuthField label="Name" value={name} onChange={setName} autoComplete="name" />
        )}
        <AuthField label="Email" value={email} onChange={setEmail} autoComplete="email" />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={signUpMode ? 'new-password' : 'current-password'}
        />
        {signUpMode && consentSlot != null && (
          <div data-testid="signup-consent-slot">{consentSlot}</div>
        )}
        {error && (
          <p style={{ margin: 0, color: theme.error, fontSize: '13px' }} data-testid="auth-error">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading}
          data-testid="sign-in-submit"
          style={{
            padding: '10px 16px',
            background: theme.primary,
            color: '#fff',
            border: 'none',
            borderRadius: theme.radius,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {signUpMode ? 'Sign up' : 'Sign in'}
        </button>
        {!signUpMode && (
          <a href={forgotPasswordUrl} style={{ fontSize: '13px', color: theme.primary }}>
            Forgot password?
          </a>
        )}
      </div>
    </div>
  );
}
