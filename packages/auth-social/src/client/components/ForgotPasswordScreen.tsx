import React, { useState } from 'react';
import { AuthField } from './AuthField.js';
import { useAuthTheme } from '../theme.js';
import type { AuthActions } from '../../types.js';

interface ForgotPasswordScreenProps {
  actions: AuthActions;
  signInUrl?: string;
  onSuccess?: () => void;
}

export function ForgotPasswordScreen({
  actions,
  signInUrl = '/auth/signin',
  onSuccess,
}: ForgotPasswordScreenProps): React.ReactElement {
  const theme = useAuthTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const result = await actions.requestPasswordReset(email);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Request failed');
      return;
    }
    setSent(true);
    onSuccess?.();
  };

  return (
    <div
      style={{ maxWidth: '400px', margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}
      data-testid="forgot-password-screen"
    >
      <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: theme.text }}>Forgot password</h1>
      <p style={{ margin: '0 0 24px', fontSize: '14px', color: theme.textMuted }}>
        Enter your email and we&apos;ll send a reset link.
      </p>
      {sent ? (
        <p style={{ color: theme.text, fontSize: '14px' }} data-testid="reset-email-sent">
          If an account exists for that email, a reset link has been sent.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <AuthField label="Email" value={email} onChange={setEmail} autoComplete="email" />
          {error && <p style={{ margin: 0, color: theme.error, fontSize: '13px' }}>{error}</p>}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            data-testid="forgot-password-submit"
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
            Send reset link
          </button>
        </div>
      )}
      <a href={signInUrl} style={{ display: 'inline-block', marginTop: '20px', fontSize: '13px', color: theme.primary }}>
        Back to sign in
      </a>
    </div>
  );
}
