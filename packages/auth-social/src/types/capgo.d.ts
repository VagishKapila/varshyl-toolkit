declare module '@capgo/capacitor-social-login' {
  export const SocialLogin: {
    login(opts: { provider: 'apple' | 'google' }): Promise<{
      result?: { idToken?: string };
    }>;
  };
}
