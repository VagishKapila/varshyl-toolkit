import React, { useState } from 'react';
import { getAuthTheme } from '../theme.js';
import {
  passwordInputType,
  passwordVisibilityAriaLabel,
  togglePasswordVisibility,
} from '../passwordVisibility.js';

interface AuthFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  /** Show eye toggle for password fields. Default true. */
  showPasswordToggle?: boolean;
}

function EyeIcon({ color }: { color: string }): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon({ color }: { color: string }): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m1 1 22 22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.12 14.12a3 3 0 0 1-4.24-4.24"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  placeholder,
  showPasswordToggle = true,
}: AuthFieldProps): React.ReactElement {
  const theme = getAuthTheme();
  const isPasswordField = type === 'password';
  const canToggle = isPasswordField && showPasswordToggle;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputType = canToggle ? passwordInputType(passwordVisible) : type;

  const input = (
    <input
      type={inputType}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete={autoComplete}
      placeholder={placeholder}
      data-testid={isPasswordField ? 'password-input' : undefined}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: canToggle ? '10px 40px 10px 12px' : '10px 12px',
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        fontSize: '14px',
        color: theme.text,
        background: theme.surface,
      }}
    />
  );

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '14px', fontWeight: 500, color: theme.text }}>{label}</span>
      {canToggle ? (
        <div style={{ position: 'relative' }}>
          {input}
          <button
            type="button"
            onClick={() => setPasswordVisible(current => togglePasswordVisibility(current))}
            aria-label={passwordVisibilityAriaLabel(passwordVisible)}
            aria-pressed={passwordVisible}
            data-testid="password-visibility-toggle"
            style={{
              position: 'absolute',
              top: '50%',
              right: '8px',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: theme.textMuted,
            }}
          >
            {passwordVisible ? <EyeOffIcon color={theme.textMuted} /> : <EyeIcon color={theme.textMuted} />}
          </button>
        </div>
      ) : (
        input
      )}
    </label>
  );
}
