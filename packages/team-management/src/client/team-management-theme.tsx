'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { TeamAppTheme } from './team-theme-config.js';
import { DEFAULT_TEAM_APP_THEME } from './team-theme-config.js';
import { getLegacyTeamThemeConfigured } from './theme.js';
import { legacyTeamThemeToApp, mergeTeamTheme, teamThemeToCssVars } from './team-theme-vars.js';

const TeamThemeContext = createContext<TeamAppTheme | null>(null);

let devWarnedNoProvider = false;

function warnNoThemeProvider(): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return;
  if (devWarnedNoProvider) return;
  devWarnedNoProvider = true;
  console.warn(
    '[@varshylinc/team-management] Team UI is using default theme. Wrap your app with <TeamManagementThemeProvider theme={…}> (same theme object as auth-social AuthThemeProvider). See README.md#theming.',
  );
}

export interface TeamManagementThemeProviderProps {
  theme?: Partial<TeamAppTheme> | undefined;
  children: ReactNode;
}

/**
 * Pair with auth-social AuthThemeProvider at the app root — pass the same `theme` prop.
 * Toolkit modules cannot share React context across package boundaries.
 */
export function TeamManagementThemeProvider({
  theme,
  children,
}: TeamManagementThemeProviderProps): React.ReactElement {
  const value = useMemo(() => mergeTeamTheme(theme), [theme]);
  return <TeamThemeContext.Provider value={value}>{children}</TeamThemeContext.Provider>;
}

export function useTeamManagementTheme(): {
  theme: TeamAppTheme;
  cssVars: React.CSSProperties;
} {
  const fromProvider = useContext(TeamThemeContext);
  const [fromLegacy, setFromLegacy] = useState(() => getLegacyTeamThemeConfigured());

  useEffect(() => {
    if (fromProvider != null) return;
    setFromLegacy(getLegacyTeamThemeConfigured());
  }, [fromProvider]);

  const theme = useMemo(() => {
    if (fromProvider) return fromProvider;
    if (fromLegacy) return legacyTeamThemeToApp(fromLegacy);
    warnNoThemeProvider();
    return DEFAULT_TEAM_APP_THEME;
  }, [fromProvider, fromLegacy]);

  const cssVars = useMemo(() => teamThemeToCssVars(theme), [theme]);

  return { theme, cssVars };
}
