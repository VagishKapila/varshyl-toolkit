export { configureAuth } from './client/configure.js';
export { useAuth } from './client/use-auth.js';
export { authActions } from './client/actions.js';
export { detectPlatform, getPlatform, setPlatformOverride } from './client/platform.js';
export { getAuthTheme, setAuthTheme, DEFAULT_AUTH_THEME } from './client/theme.js';
export { SignInScreen } from './client/components/SignInScreen.js';
export { ForgotPasswordScreen } from './client/components/ForgotPasswordScreen.js';
export { ResetPasswordScreen } from './client/components/ResetPasswordScreen.js';
export { SocialButtons } from './client/components/SocialButtons.js';
export { AuthField } from './client/components/AuthField.js';
export {
  togglePasswordVisibility,
  passwordVisibilityAriaLabel,
  passwordInputType,
} from './client/passwordVisibility.js';
export type { SocialAuthProvider } from './client/providers/social-provider.js';
export { createMockSocialProvider, MockSocialProvider } from './client/providers/mock-social-provider.js';
