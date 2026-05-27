import React from 'react';
import { getPlatform } from '../platform.js';
import { getAuthTheme } from '../theme.js';

interface SocialButtonsProps {
  onApple: () => void;
  onGoogle: () => void;
  loading?: boolean;
}

export function SocialButtons({ onApple, onGoogle, loading }: SocialButtonsProps): React.ReactElement {
  const platform = getPlatform();
  const theme = getAuthTheme();
  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: theme.radius,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: '14px',
    fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="social-buttons">
      {platform === 'ios' && (
        <button type="button" style={btnStyle} onClick={onApple} disabled={loading} data-testid="sign-in-apple">
          Sign in with Apple
        </button>
      )}
      {(platform === 'android' || platform === 'web') && (
        <button type="button" style={btnStyle} onClick={onGoogle} disabled={loading} data-testid="sign-in-google">
          Sign in with Google
        </button>
      )}
    </div>
  );
}
