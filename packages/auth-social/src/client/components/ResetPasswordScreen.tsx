import React, { useState } from 'react';
import { AuthField } from './AuthField.js';
import { useAuthTheme } from '../theme.js';
import type { AuthActions } from '../../types.js';

interface ResetPasswordScreenProps {
  actions: AuthActions;
  token: string;
  signInUrl?: string;
  onSuccess?: () => void;
}

export function ResetPasswordScreen({
  actions,
  token,
  signInUrl = '/auth/signin',
  onSuccess,
}: ResetPasswordScreenProps): React.ReactElement {
  const theme = useAuthTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await actions.resetPassword(token, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Reset failed');
      return;
    }
    setDone(true);
    onSuccess?.();
  };

  return (
    <div
      style={{ maxWidth: '400px', margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}
      data-testid="reset-password-screen"
    >
      <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: theme.text }}>Reset password</h1>
      {done ? (
        <p style={{ color: theme.text, fontSize: '14px' }} data-testid="reset-password-done">
          Password updated. You can sign in with your new password.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <AuthField label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <AuthField label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          {error && <p style={{ margin: 0, color: theme.error, fontSize: '13px' }}>{error}</p>}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading || !token}
            data-testid="reset-password-submit"
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
            Update password
          </button>
        </div>
      )}
      <a href={signInUrl} style={{ display: 'inline-block', marginTop: '20px', fontSize: '13px', color: theme.primary }}>
        Back to sign in
      </a>
    </div>
  );
}
