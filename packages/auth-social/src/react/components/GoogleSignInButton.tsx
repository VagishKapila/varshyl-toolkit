import React, { useCallback, useEffect, useState } from 'react';
import { GoogleSetupGuide } from './GoogleSetupGuide.js';
import { formTheme } from '../styles.js';

export interface GoogleSignInButtonProps {
  googleClientId: string;
  onSuccess: (token: string) => Promise<void>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  label?: string;
}

function isConfiguredClientId(id: string): boolean {
  const trimmed = id.trim();
  if (!trimmed || trimmed === 'YOUR_CLIENT_ID') return false;
  return trimmed.includes('.apps.googleusercontent.com');
}

function loadGisScript(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const existing = document.querySelector('script[data-as-gis]');
  if (existing) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.asGis = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({
  googleClientId,
  onSuccess,
  onError,
  disabled = false,
  label = 'Continue with Google',
}: GoogleSignInButtonProps): React.ReactElement {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isConfiguredClientId(googleClientId)) return;
    loadGisScript()
      .then(() => {
        const g = (window as Window & { google?: { accounts: { id: {
          initialize: (cfg: object) => void;
          prompt: () => void;
        } } } }).google;
        g?.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;
            try {
              await onSuccess(response.credential);
            } catch (err) {
              onError?.(err instanceof Error ? err : new Error(String(err)));
            }
          },
        });
        setReady(true);
      })
      .catch((err) => onError?.(err instanceof Error ? err : new Error(String(err))));
  }, [googleClientId, onError, onSuccess]);

  const handleClick = useCallback(() => {
    const g = (window as Window & { google?: { accounts: { id: { prompt: () => void } } } }).google;
    g?.accounts.id.prompt();
  }, []);

  if (!isConfiguredClientId(googleClientId)) {
    return <GoogleSetupGuide />;
  }

  return (
    <button
      type="button"
      disabled={disabled || !ready}
      onClick={handleClick}
      style={{
        width: '100%',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        background: formTheme.white,
        color: formTheme.ink,
        border: `1px solid ${formTheme.border}`,
        borderRadius: formTheme.buttonRadius,
        fontFamily: formTheme.font,
        fontSize: '15px',
        fontWeight: 600,
        cursor: disabled || !ready ? 'not-allowed' : 'pointer',
        opacity: disabled || !ready ? 0.6 : 1,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      {label}
    </button>
  );
}
