/**
 * AuthTheme-compatible tokens — pass one object to AuthThemeProvider and
 * TeamManagementThemeProvider (modules cannot import each other).
 */
export interface TeamAppTheme {
  primary: string;
  primaryHover: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  error: string;
  success: string;
  radius: string;
  fontHeading?: string;
  fontBody?: string;
}

/** @deprecated Use TeamAppTheme via TeamManagementThemeProvider; still supported in setTeamTheme(). */
export interface TeamManagementTheme {
  paper: string;
  brick: string;
  brass: string;
  ink: string;
  fontHeading: string;
  fontBody: string;
}

export const DEFAULT_TEAM_APP_THEME: TeamAppTheme = {
  primary: '#8B3A2F',
  primaryHover: '#6E2E25',
  surface: '#FAF7F0',
  border: '#B8893E',
  text: '#211D18',
  textMuted: '#8a7f6f',
  error: '#8B3A2F',
  success: '#2D6A4F',
  radius: '8px',
  fontHeading: '"Fraunces", Georgia, serif',
  fontBody: '"Inter", system-ui, sans-serif',
};

export const DEFAULT_TEAM_THEME: TeamManagementTheme = {
  paper: DEFAULT_TEAM_APP_THEME.surface,
  brick: DEFAULT_TEAM_APP_THEME.primary,
  brass: DEFAULT_TEAM_APP_THEME.border,
  ink: DEFAULT_TEAM_APP_THEME.text,
  fontHeading: DEFAULT_TEAM_APP_THEME.fontHeading ?? '"Fraunces", Georgia, serif',
  fontBody: DEFAULT_TEAM_APP_THEME.fontBody ?? '"Inter", system-ui, sans-serif',
};
