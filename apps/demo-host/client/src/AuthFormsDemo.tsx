import React, { useState } from 'react';
import {
  SignUpForm,
  SignInForm,
  GoogleSignInButton,
} from '@varshylinc/auth-social/react';

type AuthTab = 'signup' | 'signin' | 'google';

const theme = {
  bg: '#FBF8F1',
  ink: '#2D3B36',
  sage: '#7C9B8A',
  muted: '#6b7c76',
  border: '#E4DDD4',
  white: '#ffffff',
};

export function AuthFormsDemoPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<AuthTab>('signup');
  const [result, setResult] = useState('');

  const tabStyle = (tab: AuthTab): React.CSSProperties => ({
    padding: '10px 16px',
    border: 'none',
    borderBottom: activeTab === tab ? `2px solid ${theme.sage}` : '2px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? theme.ink : theme.muted,
    fontWeight: activeTab === tab ? 700 : 500,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
  });

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <h1 style={{ color: theme.ink, fontSize: '22px', marginBottom: '16px' }}>Auth Forms Demo</h1>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          <button type="button" style={tabStyle('signup')} onClick={() => setActiveTab('signup')}>Sign Up</button>
          <button type="button" style={tabStyle('signin')} onClick={() => setActiveTab('signin')}>Sign In</button>
          <button type="button" style={tabStyle('google')} onClick={() => setActiveTab('google')}>Google Sign In</button>
        </div>
        <div style={{ background: theme.white, borderRadius: '12px', padding: '16px', border: `1px solid ${theme.border}` }}>
          {activeTab === 'signup' && (
            <SignUpForm
              productName="Your App Name"
              termsUrl="#terms"
              privacyUrl="#privacy"
              onSubmit={async (data) => { setResult(JSON.stringify(data, null, 2)); }}
              onSignInClick={() => setActiveTab('signin')}
            />
          )}
          {activeTab === 'signin' && (
            <SignInForm
              productName="Your App Name"
              onSubmit={async (data) => { setResult(JSON.stringify(data, null, 2)); }}
              onSignUpClick={() => setActiveTab('signup')}
            />
          )}
          {activeTab === 'google' && (
            <>
              <div style={{ background: theme.sage, color: theme.ink, fontSize: '12px', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                This tab shows the built-in setup guide that appears when googleClientId is not configured.
                Replace the placeholder with your own Google OAuth Client ID to see the real button.
              </div>
              <GoogleSignInButton
                googleClientId="YOUR_CLIENT_ID"
                onSuccess={async (token) => { setResult(`Token: ${token.slice(0, 20)}...`); }}
              />
            </>
          )}
        </div>
        {result && (
          <pre style={{ marginTop: '16px', background: theme.ink, color: theme.bg, padding: '12px', borderRadius: '8px', fontSize: '12px', overflow: 'auto' }}>
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}
