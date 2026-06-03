import type { CSSProperties } from 'react';
import type { TeamAppTheme, TeamManagementTheme } from './team-theme-config.js';
import { DEFAULT_TEAM_APP_THEME } from './team-theme-config.js';

export function mergeTeamTheme(partial?: Partial<TeamAppTheme>): TeamAppTheme {
  return { ...DEFAULT_TEAM_APP_THEME, ...partial };
}

export function legacyTeamThemeToApp(theme: TeamManagementTheme): TeamAppTheme {
  return mergeTeamTheme({
    surface: theme.paper,
    primary: theme.brick,
    primaryHover: theme.brick,
    border: theme.brass,
    text: theme.ink,
    textMuted: theme.brass,
    error: theme.brick,
    success: DEFAULT_TEAM_APP_THEME.success,
    radius: DEFAULT_TEAM_APP_THEME.radius,
    fontHeading: theme.fontHeading,
    fontBody: theme.fontBody,
  });
}

export function teamThemeToCssVars(theme: TeamAppTheme): CSSProperties {
  return {
    ['--tm-primary' as string]: theme.primary,
    ['--tm-primary-hover' as string]: theme.primaryHover,
    ['--tm-surface' as string]: theme.surface,
    ['--tm-border' as string]: theme.border,
    ['--tm-ink' as string]: theme.text,
    ['--tm-muted' as string]: theme.textMuted,
    ['--tm-danger' as string]: theme.error,
    ['--tm-success' as string]: theme.success,
    ['--tm-radius' as string]: theme.radius,
    ['--tm-button-radius' as string]: theme.radius,
    ['--tm-font-heading' as string]: theme.fontHeading ?? DEFAULT_TEAM_APP_THEME.fontHeading,
    ['--tm-font-body' as string]: theme.fontBody ?? DEFAULT_TEAM_APP_THEME.fontBody,
    ['--tm-card-surface' as string]: '#ffffff',
  };
}
