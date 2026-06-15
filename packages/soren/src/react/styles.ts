/**
 * Sage + Soren design tokens, expressed as CSS custom properties with
 * fallbacks so a host app can override any of them. Zero orange.
 */
export const SOREN_VARS = {
  surface: 'var(--soren-surface, var(--surface, #FBF8F1))',
  card: 'var(--soren-card, var(--card, #F5F1E8))',
  ink: 'var(--soren-ink, var(--ink, #2D3B36))',
  sage: 'var(--soren-sage, var(--sage, #7C9B8A))',
  danger: 'var(--soren-danger, #b3261e)',
  gradient: 'var(--soren-gradient, linear-gradient(135deg, #6366f1, #a855f7, #ec4899))',
  radius: 'var(--soren-radius, 16px)',
  tap: 'var(--soren-tap, 48px)',
} as const;

const STYLE_ID = 'soren-card-styles';

const CSS = `
.soren-card{background:${SOREN_VARS.card};color:${SOREN_VARS.ink};border-radius:${SOREN_VARS.radius};
padding:16px;box-shadow:0 6px 24px rgba(0,0,0,.12);max-width:480px;width:100%;box-sizing:border-box;
font-family:Inter,system-ui,-apple-system,sans-serif;}
.soren-card__title{font-size:17px;font-weight:600;margin:0;}
.soren-card__subtitle{font-size:13px;opacity:.7;margin:4px 0 0;}
.soren-card__items{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:8px;}
.soren-card__item{display:flex;gap:10px;align-items:center;padding:8px;border-radius:10px;background:rgba(0,0,0,.03);}
.soren-card__thumb{width:40px;height:40px;border-radius:8px;object-fit:cover;background:${SOREN_VARS.gradient};flex:0 0 auto;}
.soren-card__item-title{font-size:14px;font-weight:500;margin:0;}
.soren-card__item-sub{font-size:12px;opacity:.6;margin:2px 0 0;}
.soren-card__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
.soren-btn{min-height:${SOREN_VARS.tap};padding:0 16px;border:0;border-radius:12px;font-size:15px;font-weight:600;
cursor:pointer;flex:1 1 auto;color:${SOREN_VARS.ink};background:rgba(0,0,0,.06);}
.soren-btn--primary{background:${SOREN_VARS.sage};color:#fff;}
.soren-btn--danger{background:${SOREN_VARS.danger};color:#fff;}
`;

let injected = false;

/** Inject the card stylesheet once (no-op on the server / repeat calls). */
export function ensureCardStyles(): void {
  if (injected || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) {
    injected = true;
    return;
  }
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}
