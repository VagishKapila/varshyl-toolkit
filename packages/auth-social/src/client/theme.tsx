import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthTheme } from '../config.js';
import { DEFAULT_AUTH_THEME } from '../config.js';

function mergeTheme(partial?: Partial<AuthTheme>): AuthTheme {
  return { ...DEFAULT_AUTH_THEME, ...partial };
}

const AuthThemeContext = createContext<AuthTheme | null>(null);

const themeListeners = new Set<() => void>();
let moduleTheme: AuthTheme = DEFAULT_AUTH_THEME;

function notifyThemeListeners(): void {
  themeListeners.forEach(listener => listener());
}

export interface AuthThemeProviderProps {
  /** Product brand theme — changes re-render auth components under this provider. */
  theme?: Partial<AuthTheme> | undefined;
  children: ReactNode;
}

/**
 * Wrap your app root (or auth routes) so SignInScreen and siblings pick up theme
 * on first paint and when `theme` changes — no useEffect setAuthTheme race.
 */
export function AuthThemeProvider({ theme, children }: AuthThemeProviderProps): React.ReactElement {
  const value = useMemo(() => mergeTheme(theme), [theme]);
  return <AuthThemeContext.Provider value={value}>{children}</AuthThemeContext.Provider>;
}

/** Subscribe to theme in React components (provider wins over module-level setAuthTheme). */
export function useAuthTheme(): AuthTheme {
  const fromProvider = useContext(AuthThemeContext);
  const [fromModule, setFromModule] = useState(moduleTheme);

  useEffect(() => {
    if (fromProvider != null) return;
    const listener = () => setFromModule(moduleTheme);
    themeListeners.add(listener);
    return () => {
      themeListeners.delete(listener);
    };
  }, [fromProvider]);

  return fromProvider ?? fromModule;
}

/** Imperative theme override — prefer AuthThemeProvider when possible. */
export function setAuthTheme(theme: Partial<AuthTheme>): void {
  moduleTheme = mergeTheme(theme);
  notifyThemeListeners();
}

/** Sync read for non-React code paths. */
export function getAuthTheme(): AuthTheme {
  return moduleTheme;
}

export { DEFAULT_AUTH_THEME };
