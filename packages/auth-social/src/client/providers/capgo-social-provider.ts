import type { SocialAuthProvider } from './social-provider.js';

/**
 * Real native social login via @capgo/capacitor-social-login.
 * Host products must install the Capacitor plugin separately.
 */
export function createCapgoSocialProvider(): SocialAuthProvider {
  return {
    async login(provider) {
      const mod = await import('@capgo/capacitor-social-login');
      const SocialLogin = mod.SocialLogin;
      const result = await SocialLogin.login({ provider });
      const idToken = result.result?.idToken;
      if (!idToken) throw new Error(`${provider} sign-in did not return an idToken`);
      return { idToken };
    },
  };
}
