export interface AuthConfig {
  resetUrlBase: string;
  sessionTtlDays?: number;
  appleClientId?: string | string[];
  googleClientId?: string | string[];
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

/** Neutral default — brand colors belong in product themes, not toolkit orange. */
export const DEFAULT_AUTH_THEME: AuthTheme = {
  primary: '#1F2937',
  primaryHover: '#111827',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  error: '#dc2626',
  radius: '8px',
};
