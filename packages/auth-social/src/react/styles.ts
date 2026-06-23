import type { CSSProperties } from 'react';

export const formTheme = {
  bg: '#FBF8F1',
  primary: '#7C9B8A',
  ink: '#2D3B36',
  border: '#E4DDD4',
  error: '#ef4444',
  muted: '#6b7c76',
  white: '#ffffff',
  font: 'system-ui, -apple-system, sans-serif',
  inputRadius: '12px',
  buttonRadius: '10px',
} as const;

export const fieldStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: formTheme.inputRadius,
  border: `1px solid ${formTheme.border}`,
  fontSize: '15px',
  fontFamily: formTheme.font,
  color: formTheme.ink,
  background: formTheme.white,
  boxSizing: 'border-box',
};

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: formTheme.ink,
  marginBottom: '6px',
};
