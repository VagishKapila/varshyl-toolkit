/**
 * Substitute {{PRODUCT_NAME}} in a consent display_text template.
 *
 * IMPORTANT: call this at SEED TIME only (inside seedStandardConsents).
 * Components must display display_text from the DB verbatim and must never
 * interpolate productName at render time.
 */
export function applyProductName(template: string, productName: string): string {
  return template.replace(/\{\{PRODUCT_NAME\}\}/g, productName);
}
