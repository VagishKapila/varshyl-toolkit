import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  SignInScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  configureAuth,
  createMockSocialProvider,
  useAuth,
} from '@varshylinc/auth-social/client';
import { SignupConsentBlock } from '@varshylinc/onboarding-consent-engine/client';

configureAuth({
  apiBaseUrl: '/api/auth',
  socialProvider: createMockSocialProvider('smoke-user', 'smoke@example.com'),
});

export function AuthSignInPage(): React.ReactElement {
  const navigate = useNavigate();
  const { actions } = useAuth();
  return (
    <SignInScreen
      actions={actions}
      onSuccess={() => navigate('/auth/authed')}
      forgotPasswordUrl="/auth/forgot-password"
    />
  );
}

export function AuthSignUpPage(): React.ReactElement {
  const navigate = useNavigate();
  const { actions } = useAuth();
  const [aiTrainingChecked, setAiTrainingChecked] = useState(false);
  return (
    <SignInScreen
      actions={actions}
      signUpMode
      onSuccess={() => navigate('/auth/authed')}
      consentSlot={
        <SignupConsentBlock
          termsUrl="https://example.com/terms"
          privacyUrl="https://example.com/privacy"
          aiTrainingChecked={aiTrainingChecked}
          onAiTrainingChange={setAiTrainingChecked}
          actionPhrase="creating your account"
        />
      }
    />
  );
}

export function AuthForgotPasswordPage(): React.ReactElement {
  const { actions } = useAuth();
  return <ForgotPasswordScreen actions={actions} signInUrl="/auth/signin" />;
}

export function AuthResetPasswordPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { actions } = useAuth();
  return <ResetPasswordScreen actions={actions} token={token} signInUrl="/auth/signin" />;
}

export function AuthAuthedPage(): React.ReactElement {
  const navigate = useNavigate();
  const { state, actions, loading } = useAuth();

  useEffect(() => {
    if (!loading && !state.isAuthenticated) navigate('/auth/signin');
  }, [loading, state.isAuthenticated, navigate]);

  if (loading) return <div data-testid="auth-loading">Loading…</div>;

  return (
    <div style={{ padding: '32px', fontFamily: 'system-ui, sans-serif' }} data-testid="auth-authed">
      <h1>Signed in</h1>
      <p>User ID: {state.userId}</p>
      <button type="button" onClick={() => void actions.signOut().then(() => navigate('/auth/signin'))}>
        Sign out
      </button>
    </div>
  );
}
