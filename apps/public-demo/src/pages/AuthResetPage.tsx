import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ResetPasswordScreen, useAuth } from '@varshylinc/auth-social/client';
import { DemoShell } from '../components/DemoShell.js';

export function AuthResetPage(): React.ReactElement {
  const [params] = useSearchParams();
  const token = params.get('token') ?? 'demo-reset-token';
  const { actions } = useAuth();

  return (
    <DemoShell title="auth-social — Reset password">
      <ResetPasswordScreen actions={actions} token={token} signInUrl="/auth" />
      <p className="mt-4 text-sm text-center">
        <Link to="/auth" style={{ color: '#8B3A2F' }}>
          ← Back to sign in
        </Link>
      </p>
    </DemoShell>
  );
}
