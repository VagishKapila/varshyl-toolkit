export interface AuthConfig {
  resetUrlBase: string;
  sessionTtlDays?: number;
  appleClientId?: string;
  googleClientId?: string;
}

export interface SocialAuthProviderLike {
  login(provider: 'apple' | 'google'): Promise<{ idToken: string }>;
}

export interface ProductAuthConfig {
  apiBaseUrl: string;
  theme?: AuthTheme;
  socialProvider?: SocialAuthProviderLike;
}

export interface AuthTheme {
  primary: string;
  primaryHover: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  error: string;
  radius: string;
}

export const DEFAULT_AUTH_THEME: AuthTheme = {
  primary: '#ea580c',
  primaryHover: '#c2410c',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  error: '#dc2626',
  radius: '8px',
};
