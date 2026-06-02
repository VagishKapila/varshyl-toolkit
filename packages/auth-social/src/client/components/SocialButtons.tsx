import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { ensureAuthSocialClientStyles } from '../injectClientStyles.js';
import { AppleLogo } from '../assets/AppleLogo.js';
import { GoogleLogo } from '../assets/GoogleLogo.js';
import { useAuthTheme } from '../theme.js';
import {
  resolveSocialProviders,
  shouldWarnAppStore48,
  type SocialProvider,
} from '../socialButtonsLogic.js';
export type SocialButtonsVariant = 'default' | 'official';
export type SocialButtonsMode = 'signIn' | 'signUp';

export interface SocialButtonsProps {
  onApple: () => void;
  onGoogle: () => void;
  loading?: boolean | undefined;
  /** Which providers to consider. Default `['apple', 'google']`. */
  providers?: SocialProvider[] | undefined;
  /** Default true when Google is shown (App Store 4.8). */
  showApple?: boolean | undefined;
  /** Default true. */
  showGoogle?: boolean | undefined;
  /** `official` uses Apple/Google brand styling + logos. Default `official`. */
  variant?: SocialButtonsVariant | undefined;
  /** Sign-in vs sign-up button copy. Default `signIn`. */
  mode?: SocialButtonsMode | undefined;
  appleLabel?: string | undefined;
  googleLabel?: string | undefined;
  className?: string | undefined;
  socialButtonClassName?: string | undefined;
}

function defaultLabel(provider: SocialProvider, mode: SocialButtonsMode): string {
  const verb = mode === 'signUp' ? 'Sign up' : 'Sign in';
  return provider === 'apple' ? `${verb} with Apple` : `${verb} with Google`;
}

export function SocialButtons({
  onApple,
  onGoogle,
  loading = false,
  providers,
  showApple,
  showGoogle,
  variant = 'official',
  mode = 'signIn',
  appleLabel,
  googleLabel,
  className = '',
  socialButtonClassName = '',
}: SocialButtonsProps): React.ReactElement {
  useLayoutEffect(() => {
    ensureAuthSocialClientStyles();
  }, []);

  const theme = useAuthTheme();
  const resolved = useMemo(
    () => resolveSocialProviders({ providers, showApple, showGoogle }),
    [providers, showApple, showGoogle],
  );

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production'
      && shouldWarnAppStore48(showApple, resolved)
    ) {
      console.warn(
        '[@varshylinc/auth-social] App Store guideline 4.8: offering Google sign-in without '
          + 'Sign in with Apple may cause iOS rejection. Set showApple={true} or include apple in providers.',
      );
    }
  }, [showApple, showGoogle, resolved]);

  const defaultBtnStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '44px',
    padding: '10px 16px',
    borderRadius: theme.radius,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: '14px',
    fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

  const renderButton = (provider: SocialProvider): React.ReactElement => {
    const isApple = provider === 'apple';
    const onClick = isApple ? onApple : onGoogle;
    const label = isApple
      ? (appleLabel ?? defaultLabel('apple', mode))
      : (googleLabel ?? defaultLabel('google', mode));
    const testId = isApple ? 'sign-in-apple' : 'sign-in-google';

    if (variant === 'official') {
      const officialClass = isApple
        ? 'as-social-button as-social-button--official-apple'
        : 'as-social-button as-social-button--official-google';
      return (
        <button
          key={provider}
          type="button"
          className={[officialClass, socialButtonClassName].filter(Boolean).join(' ')}
          onClick={onClick}
          disabled={loading}
          data-testid={testId}
          aria-label={label}
        >
          {isApple ? <AppleLogo /> : <GoogleLogo />}
          <span>{label}</span>
        </button>
      );
    }

    return (
      <button
        key={provider}
        type="button"
        style={defaultBtnStyle}
        className={socialButtonClassName || undefined}
        onClick={onClick}
        disabled={loading}
        data-testid={testId}
        aria-label={label}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className={['as-social-buttons', className].filter(Boolean).join(' ')}
      data-testid="social-buttons"
    >
      {resolved.map(renderButton)}
    </div>
  );
}
