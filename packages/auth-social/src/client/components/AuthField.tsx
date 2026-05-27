import React from 'react';
import { getAuthTheme } from '../theme.js';

interface AuthFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}

export function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  placeholder,
}: AuthFieldProps): React.ReactElement {
  const theme = getAuthTheme();
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '14px', fontWeight: 500, color: theme.text }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{
          padding: '10px 12px',
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius,
          fontSize: '14px',
          color: theme.text,
          background: theme.surface,
        }}
      />
    </label>
  );
}
