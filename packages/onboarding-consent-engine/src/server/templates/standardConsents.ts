/**
 * Canonical consent set for all Varshyl products.
 *
 * display_text contains the placeholder {{PRODUCT_NAME}}.
 * Call applyProductName() at SEED TIME only — components must display
 * display_text from the DB verbatim and never interpolate at render time.
 */
export const STANDARD_CONSENTS = [
  {
    key: 'terms_of_service',
    required: true,
    display_text: 'I agree to the {{PRODUCT_NAME}} Terms of Service.',
    legal_url: null,
  },
  {
    key: 'privacy_policy',
    required: true,
    display_text: 'I agree to the {{PRODUCT_NAME}} Privacy Policy.',
    legal_url: null,
  },
  {
    key: 'marketing_emails',
    required: false,
    display_text:
      'I would like to receive product updates and marketing emails from {{PRODUCT_NAME}}.',
    legal_url: null,
  },
  {
    key: 'ai_training',
    required: false,
    display_text:
      'I consent to {{PRODUCT_NAME}} using anonymized data from my sessions to improve AI models.',
    legal_url: null,
  },
] as const;

export type StandardConsentKey = (typeof STANDARD_CONSENTS)[number]['key'];
