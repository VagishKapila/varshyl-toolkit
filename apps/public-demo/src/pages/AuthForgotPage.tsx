import React from 'react';
import { Link } from 'react-router-dom';
import { ForgotPasswordScreen, useAuth } from '@varshylinc/auth-social/client';
import { DemoShell } from '../components/DemoShell.js';
import { getLastResetToken } from '../mocks/authMock.js';

export function AuthForgotPage(): React.ReactElement {
  const { actions } = useAuth();
  const [demoToken, setDemoToken] = React.useState<string | null>(null);

  return (
    <DemoShell title="auth-social — Forgot password">
      <ForgotPasswordScreen
        actions={actions}
        signInUrl="/auth"
        onSuccess={() => setDemoToken(getLastResetToken())}
      />
      {demoToken && (
        <p className="mt-4 text-sm rounded-lg border p-3 max-w-md mx-auto" style={{ borderColor: '#E8DFD0' }}>
          Demo mode: no email server —{' '}
          <Link to={`/auth/reset?token=${encodeURIComponent(demoToken)}`} style={{ color: '#8B3A2F' }}>
            continue to reset password →
          </Link>
        </p>
      )}
    </DemoShell>
  );
}
