import { useCallback, useState } from 'react';

export interface UseAuthFormReturn {
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
  errors: Record<string, string>;
  isLoading: boolean;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  setAgreedToTerms: (v: boolean) => void;
  validateSignUp: () => boolean;
  validateSignIn: () => boolean;
  reset: () => void;
}

function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}

export function useAuthForm(): UseAuthFormReturn {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading] = useState(false);

  const validateSignIn = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [email, password]);

  const validateSignUp = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords must match';
    if (!agreedToTerms) next.agreedToTerms = 'You must agree to the terms';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [agreedToTerms, confirmPassword, email, password]);

  const reset = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgreedToTerms(false);
    setErrors({});
  }, []);

  return {
    email,
    password,
    confirmPassword,
    agreedToTerms,
    errors,
    isLoading,
    setEmail,
    setPassword,
    setConfirmPassword,
    setAgreedToTerms,
    validateSignUp,
    validateSignIn,
    reset,
  };
}
