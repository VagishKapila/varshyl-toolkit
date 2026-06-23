import React from 'react';
import { formTheme } from '../styles.js';

export function GoogleSetupGuide(): React.ReactElement {
  return (
    <div
      style={{
        fontFamily: formTheme.font,
        border: `1px solid ${formTheme.border}`,
        borderRadius: formTheme.inputRadius,
        padding: '16px',
        background: formTheme.white,
        color: formTheme.ink,
        fontSize: '14px',
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '8px' }}>⚙️ Google Sign In Setup</div>
      <p style={{ margin: '0 0 8px' }}>You need your own Google OAuth client. This is FREE and takes 5 minutes.</p>
      <ol style={{ margin: '0 0 8px', paddingLeft: '20px' }}>
        <li>Go to console.cloud.google.com</li>
        <li>Create a project (or use existing)</li>
        <li>APIs &amp; Services → Credentials</li>
        <li>Create OAuth 2.0 Client ID → Web application</li>
        <li>Add your domain to Authorized JavaScript origins</li>
        <li>Copy the Client ID</li>
        <li>
          Pass it as googleClientId prop:
          <pre style={{ margin: '8px 0 0', fontSize: '12px', background: formTheme.bg, padding: '8px', borderRadius: '8px' }}>
{`<GoogleSignInButton
  googleClientId="YOUR_CLIENT_ID_HERE"
  onSuccess={handleGoogleSuccess}
/>`}
          </pre>
        </li>
      </ol>
      <p style={{ margin: 0, color: formTheme.primary, fontWeight: 600 }}>
        ✅ Your credentials are private to you. Varshyl never sees them.
      </p>
    </div>
  );
}
