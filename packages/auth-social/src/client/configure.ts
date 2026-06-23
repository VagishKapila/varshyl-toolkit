import type { ProductAuthConfig } from '../config.js';
import {
  configureSocialAuth,
  DEFAULT_AUTH_THEME,
  getSocialAuthApiBaseUrl,
} from '../config.js';
import { setAuthTheme } from './theme.js';
import { createMockSocialProvider } from './providers/mock-social-provider.js';
import type { SocialAuthProvider } from './providers/social-provider.js';

let socialProvider: SocialAuthProvider = createMockSocialProvider();

export function configureAuth(config: ProductAuthConfig): void {
  configureSocialAuth(config);
  if (config.theme) setAuthTheme(config.theme);
  if (config.socialProvider) socialProvider = config.socialProvider;
}

export function getApiBaseUrl(): string {
  return getSocialAuthApiBaseUrl();
}

export function getSocialProvider(): SocialAuthProvider {
  return socialProvider;
}

export function getDefaultTheme() {
  return DEFAULT_AUTH_THEME;
}
