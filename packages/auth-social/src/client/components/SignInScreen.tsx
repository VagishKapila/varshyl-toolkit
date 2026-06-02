import React, { useState } from 'react';
import { AuthField } from './AuthField.js';
import { AuthDivider } from './AuthDivider.js';
import { SocialButtons } from './SocialButtons.js';
import { useAuthTheme } from '../theme.js';
import type { AuthActions } from '../../types.js';
import type { SocialButtonsMode, SocialButtonsVariant } from './SocialButtons.js';

interface SignInScreenProps {
  actions: AuthActions;
  onSuccess?: () => void | undefined;
  forgotPasswordUrl?: string | undefined;
  signUpMode?: boolean | undefined;
  /** Signup-only slot for consent UI (e.g. OCE SignupConsentBlock). Ignored when signUpMode is false. */
  consentSlot?: React.ReactNode;
  submitButtonClassName?: string | undefined;
  socialButtonClassName?: string | undefined;
  containerClassName?: string | undefined;
  inputClassName?: string | undefined;
  /** Default "or continue with email" */
  dividerText?: string | undefined;
  socialVariant?: SocialButtonsVariant | undefined;
}

export function SignInScreen({
  actions,
  onSuccess,
  forgotPasswordUrl = '/auth/forgot-password',
  signUpMode = false,
  consentSlot,
  submitButtonClassName = '',
  socialButtonClassName = '',
  containerClassName = '',
  inputClassName = '',
  dividerText,
  socialVariant = 'official',
}: SignInScreenProps): React.ReactElement {
  const theme = useAuthTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const socialMode: SocialButtonsMode = signUpMode ? 'signUp' : 'signIn';

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

  const containerStyle: React.CSSProperties = {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '32px 24px',
    fontFamily: 'system-ui, sans-serif',
  };

  const submitStyle: React.CSSProperties = {
    padding: '10px 16px',
    background: theme.primary,
    color: '#fff',
    border: 'none',
    borderRadius: theme.radius,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    width: '100%',
    minHeight: '44px',
  };

  return (
    <div
      style={containerStyle}
      className={containerClassName || undefined}
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
        variant={socialVariant}
        mode={socialMode}
        socialButtonClassName={socialButtonClassName}
      />

      <AuthDivider text={dividerText} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {signUpMode && (
          <AuthField
            label="Name"
            value={name}
            onChange={setName}
            autoComplete="name"
            inputClassName={inputClassName}
          />
        )}
        <AuthField
          label="Email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          inputClassName={inputClassName}
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={signUpMode ? 'new-password' : 'current-password'}
          inputClassName={inputClassName}
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
          style={submitStyle}
          className={submitButtonClassName || undefined}
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
