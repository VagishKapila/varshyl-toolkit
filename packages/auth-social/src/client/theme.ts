import type { AuthTheme } from '../config.js';
import { DEFAULT_AUTH_THEME } from '../config.js';

let activeTheme: AuthTheme = DEFAULT_AUTH_THEME;

export function setAuthTheme(theme: Partial<AuthTheme>): void {
  activeTheme = { ...DEFAULT_AUTH_THEME, ...theme };
}

export function getAuthTheme(): AuthTheme {
  return activeTheme;
}

export { DEFAULT_AUTH_THEME };
