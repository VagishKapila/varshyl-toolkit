export interface SocialAuthProvider {
  login(provider: 'apple' | 'google'): Promise<{ idToken: string }>;
}
