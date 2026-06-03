/**
 * Copy-paste starting point: signup screen with auth-social + optional consent slot.
 *
 * Install: npm install @varshylinc/auth-social
 * Peer deps: react, pg (server). See packages/auth-social/README.md for server setup.
 *
 * Consent UI: pair with examples/onboarding-consent-engine-two-button.tsx in consentSlot.
 */
'use client';

import {
  AuthThemeProvider,
  SignInScreen,
  authActions,
  configureAuth,
} from '@varshylinc/auth-social/client';

// Call once before rendering auth UI (e.g. in app/layout.tsx or _app.tsx).
configureAuth({ apiBaseUrl: '/api/auth' });

const PRODUCT_THEME = {
  primary: '#3A6B5F',
  primaryHover: '#2D544A',
  surface: '#FAF7F0',
};

export function SignupPage({ consentSlot }: { consentSlot?: React.ReactNode }) {
  return (
    <AuthThemeProvider theme={PRODUCT_THEME}>
      <SignInScreen
        signUpMode
        actions={authActions}
        consentSlot={consentSlot}
        onSuccess={() => {
          window.location.href = '/home';
        }}
        forgotPasswordUrl="/forgot-password"
      />
    </AuthThemeProvider>
  );
}

// App root — AuthThemeProvider must wrap every route that renders toolkit auth UI.
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthThemeProvider theme={PRODUCT_THEME}>{children}</AuthThemeProvider>;
}
