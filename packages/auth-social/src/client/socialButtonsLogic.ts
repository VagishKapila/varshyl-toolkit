export type SocialProvider = 'apple' | 'google';

export interface ResolveSocialProvidersInput {
  providers?: SocialProvider[] | undefined;
  showApple?: boolean | undefined;
  showGoogle?: boolean | undefined;
}

const DEFAULT_PROVIDERS: SocialProvider[] = ['apple', 'google'];

/**
 * Apple is always listed before Google when both are shown (Apple HIG).
 */
export function resolveSocialProviders(input: ResolveSocialProvidersInput): SocialProvider[] {
  const requested = input.providers ?? DEFAULT_PROVIDERS;
  const showGoogle = input.showGoogle ?? requested.includes('google');
  const showApple = input.showApple ?? (showGoogle ? true : requested.includes('apple'));

  const ordered: SocialProvider[] = [];
  if (showApple && requested.includes('apple')) ordered.push('apple');
  if (showGoogle && requested.includes('google')) ordered.push('google');
  return ordered;
}

export function shouldWarnAppStore48(
  showApple: boolean | undefined,
  resolved: SocialProvider[],
): boolean {
  const googleOn = resolved.includes('google');
  const appleOff = showApple === false || !resolved.includes('apple');
  return googleOn && appleOff;
}
