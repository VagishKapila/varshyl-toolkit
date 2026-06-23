import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { SignUpForm } from '../../src/react/components/SignUpForm.js';
import { SignInForm } from '../../src/react/components/SignInForm.js';
import { GoogleSignInButton } from '../../src/react/components/GoogleSignInButton.js';
import { useAuthForm } from '../../src/react/hooks/useAuthForm.js';

afterEach(() => cleanup());

test('SignUpForm renders correctly', () => {
  render(<SignUpForm onSubmit={async () => {}} />);
  expect(screen.getByText('Create your account')).toBeTruthy();
});

test('SignUpForm terms checkbox unchecked by default', () => {
  render(<SignUpForm onSubmit={async () => {}} />);
  const checkbox = screen.getByRole('checkbox');
  expect((checkbox as HTMLInputElement).checked).toBe(false);
});

test('SignUpForm submit disabled when terms unchecked', () => {
  render(<SignUpForm onSubmit={async () => {}} />);
  const btn = screen.getByText('Create Account');
  expect((btn as HTMLButtonElement).disabled).toBe(true);
});

test('SignUpForm shows error for short password', () => {
  render(<SignUpForm onSubmit={async () => {}} />);
  const pass = screen.getAllByPlaceholderText(/password/i)[0];
  fireEvent.change(pass, { target: { value: '123' } });
  fireEvent.blur(pass);
  expect(screen.getByText(/8 characters/i)).toBeTruthy();
});

test('SignInForm renders correctly', () => {
  render(<SignInForm onSubmit={async () => {}} />);
  expect(screen.getByText(/Sign in/)).toBeTruthy();
});

test('GoogleSignInButton shows setup guide when empty', () => {
  render(
    <GoogleSignInButton
      googleClientId=""
      onSuccess={async () => {}}
    />,
  );
  expect(screen.getByText(/Setup/i)).toBeTruthy();
  expect(screen.getByText(/console.cloud.google.com/)).toBeTruthy();
});

test('GoogleSignInButton shows setup for placeholder', () => {
  render(
    <GoogleSignInButton
      googleClientId="YOUR_CLIENT_ID"
      onSuccess={async () => {}}
    />,
  );
  expect(screen.getByText(/Setup/i)).toBeTruthy();
});

test('GoogleSignInButton renders button for real ID', () => {
  render(
    <GoogleSignInButton
      googleClientId="123456.apps.googleusercontent.com"
      onSuccess={async () => {}}
    />,
  );
  expect(screen.getByText(/Continue with Google/)).toBeTruthy();
});

test('useAuthForm validates bad email', () => {
  const { result } = renderHook(() => useAuthForm());
  act(() => result.current.setEmail('notanemail'));
  expect(result.current.validateSignIn()).toBe(false);
});

test('useAuthForm passes valid sign in', () => {
  const { result } = renderHook(() => useAuthForm());
  act(() => {
    result.current.setEmail('test@example.com');
    result.current.setPassword('password123');
  });
  expect(result.current.validateSignIn()).toBe(true);
});
