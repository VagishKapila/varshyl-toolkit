import type { TeamManagementTheme } from './team-theme-config.js';
import { DEFAULT_TEAM_THEME } from './team-theme-config.js';

let activeTheme: TeamManagementTheme = DEFAULT_TEAM_THEME;
let legacyThemeCustomized = false;

/** @deprecated Prefer TeamManagementThemeProvider or pass theme at app root. */
export function setTeamTheme(theme: Partial<TeamManagementTheme>): void {
  activeTheme = { ...DEFAULT_TEAM_THEME, ...theme };
  legacyThemeCustomized = true;
}

/** @deprecated Use useTeamManagementTheme() in React components. */
export function getTeamTheme(): TeamManagementTheme {
  return activeTheme;
}

export function getLegacyTeamThemeConfigured(): TeamManagementTheme | null {
  return legacyThemeCustomized ? activeTheme : null;
}

export { DEFAULT_TEAM_THEME } from './team-theme-config.js';
export type { TeamManagementTheme } from './team-theme-config.js';
