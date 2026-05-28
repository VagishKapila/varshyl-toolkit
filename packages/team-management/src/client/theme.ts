export interface TeamManagementTheme {
  paper: string;
  brick: string;
  brass: string;
  ink: string;
  fontHeading: string;
  fontBody: string;
}

export const DEFAULT_TEAM_THEME: TeamManagementTheme = {
  paper: '#FAF7F0',
  brick: '#8B3A2F',
  brass: '#B8893E',
  ink: '#211D18',
  fontHeading: '"Fraunces", Georgia, serif',
  fontBody: '"Inter", system-ui, sans-serif',
};

let activeTheme: TeamManagementTheme = DEFAULT_TEAM_THEME;

export function setTeamTheme(theme: Partial<TeamManagementTheme>): void {
  activeTheme = { ...DEFAULT_TEAM_THEME, ...theme };
}

export function getTeamTheme(): TeamManagementTheme {
  return activeTheme;
}
