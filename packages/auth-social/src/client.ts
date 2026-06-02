export { configureAuth } from './client/configure.js';
export { useAuth } from './client/use-auth.js';
export { authActions } from './client/actions.js';
export { detectPlatform, getPlatform, setPlatformOverride } from './client/platform.js';
export {
  AuthThemeProvider,
  useAuthTheme,
  getAuthTheme,
  setAuthTheme,
  DEFAULT_AUTH_THEME,
} from './client/theme.js';
export type { AuthThemeProviderProps } from './client/theme.js';
export { SignInScreen } from './client/components/SignInScreen.js';
export { ForgotPasswordScreen } from './client/components/ForgotPasswordScreen.js';
export { ResetPasswordScreen } from './client/components/ResetPasswordScreen.js';
export { SocialButtons } from './client/components/SocialButtons.js';
export type {
  SocialButtonsProps,
  SocialButtonsVariant,
  SocialButtonsMode,
} from './client/components/SocialButtons.js';
export { AuthDivider } from './client/components/AuthDivider.js';
export type { AuthDividerProps } from './client/components/AuthDivider.js';
export { AuthField } from './client/components/AuthField.js';
export { AppleLogo } from './client/assets/AppleLogo.js';
export { GoogleLogo } from './client/assets/GoogleLogo.js';
export {
  togglePasswordVisibility,
  passwordVisibilityAriaLabel,
  passwordInputType,
} from './client/passwordVisibility.js';
export type { SocialAuthProvider } from './client/providers/social-provider.js';
export { createMockSocialProvider, MockSocialProvider } from './client/providers/mock-social-provider.js';
export type { AuthConfig, AuthTheme } from './config.js';
export type { Session, AuthProvider, OAuthProvider } from './types.js';
