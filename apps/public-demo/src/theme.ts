const BRICK = '#8B3A2F';
const BRICK_HOVER = '#6E2E25';
const PAPER = '#FAF7F0';
const INK = '#211D18';
const BRASS = '#B8893E';

export const TOOLKIT_THEME_NOTE =
  'Blueprint & Brick default theme (Paper, Brick, Brass, Ink) — fully configurable per product.';

export function applyToolkitTheme(): void {
  document.body.style.backgroundColor = PAPER;
  document.body.style.color = INK;
  document.body.style.fontFamily = '"Inter", system-ui, sans-serif';
}

export function getAuthThemeOverrides() {
  return {
    primary: BRICK,
    primaryHover: BRICK_HOVER,
    surface: PAPER,
    border: '#E8DFD0',
    text: INK,
    textMuted: BRASS,
    error: '#dc2626',
    radius: '8px',
  };
}

export const shellStyles = {
  paper: PAPER,
  brick: BRICK,
  brass: BRASS,
  ink: INK,
  fontHeading: '"Fraunces", Georgia, serif',
  fontBody: '"Inter", system-ui, sans-serif',
} as const;
