import React, { useState } from 'react';
import { useAuthForm } from '../hooks/useAuthForm.js';
import { fieldStyle, formTheme, labelStyle } from '../styles.js';

export interface SignUpFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
    agreedToTerms: boolean;
  }) => Promise<void>;
  onSignInClick?: () => void;
  termsUrl?: string;
  privacyUrl?: string;
  productName?: string;
  isLoading?: boolean;
  error?: string;
}

export function SignUpForm({
  onSubmit,
  onSignInClick,
  termsUrl = '#',
  privacyUrl = '#',
  productName,
  isLoading = false,
  error,
}: SignUpFormProps): React.ReactElement {
  const form = useAuthForm();
  const [showPassword, setShowPassword] = useState(false);
  const canSubmit = form.agreedToTerms && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.validateSignUp()) return;
    await onSubmit({
      email: form.email,
      password: form.password,
      agreedToTerms: form.agreedToTerms,
    });
  };

  const passwordField = (placeholder: string, value: string, onChange: (v: string) => void, onBlur?: () => void, err?: string) => (
    <div style={{ marginBottom: err ? '4px' : '12px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={placeholder.includes('Confirm') ? 'new-password' : 'new-password'}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          onBlur={onBlur}
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
      {err && <p style={{ color: formTheme.error, fontSize: '12px', margin: '4px 0 0' }}>{err}</p>}
    </div>
  );

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} style={{ fontFamily: formTheme.font, color: formTheme.ink }}>
      <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>{productName ? `Create your ${productName} account` : 'Create your account'}</h2>
      <label style={labelStyle}>Email</label>
      <input
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={(e) => form.setEmail(e.currentTarget.value)}
        style={{ ...fieldStyle, marginBottom: form.errors.email ? '4px' : '12px' }}
      />
      {form.errors.email && <p style={{ color: formTheme.error, fontSize: '12px', margin: '0 0 8px' }}>{form.errors.email}</p>}
      <label style={labelStyle}>Password</label>
      {passwordField('Password', form.password, form.setPassword, () => {
        if (form.password.length < 8) form.validateSignUp();
      }, form.errors.password)}
      <label style={labelStyle}>Confirm password</label>
      {passwordField('Confirm password', form.confirmPassword, form.setConfirmPassword, undefined, form.errors.confirmPassword)}
      <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', marginBottom: '14px' }}>
        <input
          type="checkbox"
          checked={form.agreedToTerms}
          onChange={(e) => form.setAgreedToTerms(e.currentTarget.checked)}
          style={{ marginTop: '3px' }}
        />
        <span>
          I agree to the{' '}
          <a href={termsUrl} style={{ color: formTheme.primary }}>Terms of Service</a>
          {' '}and{' '}
          <a href={privacyUrl} style={{ color: formTheme.primary }}>Privacy Policy</a>
        </span>
      </label>
      {form.errors.agreedToTerms && (
        <p style={{ color: formTheme.error, fontSize: '12px', margin: '0 0 8px' }}>{form.errors.agreedToTerms}</p>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '12px', border: 'none', borderRadius: formTheme.buttonRadius,
          background: canSubmit ? formTheme.primary : formTheme.border,
          color: canSubmit ? formTheme.white : formTheme.muted,
          fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {isLoading ? 'Creating account…' : 'Create Account'}
      </button>
      {error && <p style={{ color: formTheme.error, fontSize: '13px', marginTop: '10px' }}>{error}</p>}
      {onSignInClick && (
        <p style={{ fontSize: '13px', marginTop: '14px' }}>
          Already have an account?{' '}
          <button type="button" onClick={onSignInClick} style={{ border: 'none', background: 'none', color: formTheme.primary, cursor: 'pointer' }}>
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}
