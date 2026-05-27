export type AuthProvider = 'email' | 'apple' | 'google';
export type OAuthProvider = 'apple' | 'google';
export type Platform = 'ios' | 'android' | 'web';

export interface Session {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface AuthState {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

export interface AuthActionResult {
  ok: boolean;
  error?: string;
  session?: Session;
}

export interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<AuthActionResult>;
  signInWithApple: () => Promise<AuthActionResult>;
  signInWithGoogle: () => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
}

export interface VerifiedIdToken {
  subject: string;
  email: string | null;
}
