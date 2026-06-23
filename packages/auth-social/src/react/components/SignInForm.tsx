import React, { useState } from 'react';
import { useAuthForm } from '../hooks/useAuthForm.js';
import { fieldStyle, formTheme, labelStyle } from '../styles.js';

export interface SignInFormProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  onSignUpClick?: () => void;
  onForgotPasswordClick?: () => void;
  productName?: string;
  isLoading?: boolean;
  error?: string;
}

export function SignInForm({
  onSubmit,
  onSignUpClick,
  onForgotPasswordClick,
  productName,
  isLoading = false,
  error,
}: SignInFormProps): React.ReactElement {
  const form = useAuthForm();
  const [showPassword, setShowPassword] = useState(false);
  const title = productName ? `Sign in to ${productName}` : 'Sign in';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.validateSignIn()) return;
    await onSubmit({ email: form.email, password: form.password });
  };

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} style={{ fontFamily: formTheme.font, color: formTheme.ink }}>
      <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>{title}</h2>
      <label style={labelStyle}>Email</label>
      <input
        type="email"
        autoComplete="email"
        inputMode="email"
        value={form.email}
        onChange={(e) => form.setEmail(e.currentTarget.value)}
        style={{ ...fieldStyle, marginBottom: form.errors.email ? '4px' : '12px' }}
      />
      {form.errors.email && <p style={{ color: formTheme.error, fontSize: '12px', margin: '0 0 8px' }}>{form.errors.email}</p>}
      <label style={labelStyle}>Password</label>
      <div style={{ position: 'relative', marginBottom: form.errors.password ? '4px' : '12px' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => form.setPassword(e.currentTarget.value)}
          onBlur={() => form.validateSignIn()}
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: formTheme.muted, cursor: 'pointer' }}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      {form.errors.password && <p style={{ color: formTheme.error, fontSize: '12px', margin: '0 0 8px' }}>{form.errors.password}</p>}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%', padding: '12px', border: 'none', borderRadius: formTheme.buttonRadius,
          background: formTheme.primary, color: formTheme.white, fontWeight: 700, cursor: isLoading ? 'wait' : 'pointer',
        }}
      >
        {isLoading ? 'Signing in…' : 'Sign In'}
      </button>
      {(error || form.errors.password) && error && (
        <p style={{ color: formTheme.error, fontSize: '13px', marginTop: '10px' }}>{error}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '13px' }}>
        {onForgotPasswordClick ? (
          <button type="button" onClick={onForgotPasswordClick} style={{ border: 'none', background: 'none', color: formTheme.primary, cursor: 'pointer' }}>
            Forgot password?
          </button>
        ) : <span />}
        {onSignUpClick && (
          <button type="button" onClick={onSignUpClick} style={{ border: 'none', background: 'none', color: formTheme.primary, cursor: 'pointer' }}>
            Create account
          </button>
        )}
      </div>
    </form>
  );
}
