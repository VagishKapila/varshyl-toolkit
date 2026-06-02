import { AUTH_SOCIAL_CLIENT_STYLES } from './clientStyles.generated.js';

let injected = false;

/** Inject bundled component styles once (browser only). */
export function ensureAuthSocialClientStyles(): void {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-auth-social', 'client-styles');
  el.textContent = AUTH_SOCIAL_CLIENT_STYLES;
  document.head.appendChild(el);
}
