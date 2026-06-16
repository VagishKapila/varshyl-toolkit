import { PAYWALL_CSS } from './paywallStyles.generated.js';

/** Inject bundled paywall styles once (browser only). */
export function ensurePaywallStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('mp-paywall-styles')) return;
  const el = document.createElement('style');
  el.id = 'mp-paywall-styles';
  el.textContent = PAYWALL_CSS;
  document.head.appendChild(el);
}
