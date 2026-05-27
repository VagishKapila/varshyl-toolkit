import type { SocialAuthProvider } from './social-provider.js';

export function createMockSocialProvider(
  subject = 'mock-user',
  email = 'mock@example.com'
): SocialAuthProvider {
  return {
    async login(provider) {
      return { idToken: `mock:${provider}:${subject}:${email}` };
    },
  };
}

export const MockSocialProvider = createMockSocialProvider();
