/**
 * Hybrid signup consent — implied ToS/Privacy + explicit optional AI training.
 * See MODULE.md and product integration spec §6.1.
 */

/** Owner-approved default copy for Job Site Intel.ai (products may override in UI). */
export const DEFAULT_AI_TRAINING_LABEL =
  'Help improve construction intelligence by sharing your anonymized project data.';

/** Consent keys recorded as implied-granted when the user completes signup. */
export const IMPLIED_SIGNUP_CONSENT_KEYS = ['terms_of_service', 'privacy_policy'] as const;

export const AI_TRAINING_CONSENT_KEY = 'ai_training' as const;

export interface BuildSignupConsentsPayloadOptions {
  /** Explicit AI-training checkbox value. Must default to false in signup UI. */
  aiTrainingGranted: boolean;
  /** Include marketing_emails in the payload (default false — not part of SignupConsentBlock). */
  includeMarketing?: boolean;
  marketingGranted?: boolean;
}

export type SignupConsentEntry = { key: string; granted: boolean };

/**
 * Builds the consent array for recordSignupConsents after signup.
 * ToS and Privacy are always granted (implied by signup action).
 * AI training is separate and must reflect the unchecked-by-default checkbox.
 */
export function buildSignupConsentsPayload(
  options: BuildSignupConsentsPayloadOptions,
): SignupConsentEntry[] {
  const consents: SignupConsentEntry[] = [
    { key: 'terms_of_service', granted: true },
    { key: 'privacy_policy', granted: true },
    { key: AI_TRAINING_CONSENT_KEY, granted: options.aiTrainingGranted },
  ];
  if (options.includeMarketing) {
    consents.push({
      key: 'marketing_emails',
      granted: options.marketingGranted ?? false,
    });
  }
  return consents;
}
