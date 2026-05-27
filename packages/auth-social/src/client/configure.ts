import type { ProductAuthConfig } from '../config.js';
import { DEFAULT_AUTH_THEME } from '../config.js';
import { setAuthTheme } from './theme.js';
import { createMockSocialProvider } from './providers/mock-social-provider.js';
import type { SocialAuthProvider } from './providers/social-provider.js';

let apiBaseUrl = '/api/auth';
let socialProvider: SocialAuthProvider = createMockSocialProvider();

export function configureAuth(config: ProductAuthConfig): void {
  apiBaseUrl = config.apiBaseUrl.replace(/\/$/, '');
  if (config.theme) setAuthTheme(config.theme);
  if (config.socialProvider) socialProvider = config.socialProvider;
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function getSocialProvider(): SocialAuthProvider {
  return socialProvider;
}

export function getDefaultTheme() {
  return DEFAULT_AUTH_THEME;
}
