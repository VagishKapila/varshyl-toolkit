import React from 'react';
import { useAuthTheme } from '../theme.js';
import './AuthDivider.css';

export interface AuthDividerProps {
  /** Default: "or continue with email" */
  text?: string | undefined;
  className?: string | undefined;
}

export function AuthDivider({
  text = 'or continue with email',
  className = '',
}: AuthDividerProps): React.ReactElement {
  const theme = useAuthTheme();
  const style = {
    '--as-divider-line': theme.border,
    '--as-divider-text': theme.textMuted,
  } as React.CSSProperties;

  return (
    <div className={`auth-divider ${className}`.trim()} style={style} data-testid="auth-divider">
      <div className="auth-divider-line" />
      <span className="auth-divider-text">{text}</span>
      <div className="auth-divider-line" />
    </div>
  );
}
