import type { UserConsent } from '../shared/types.js';
import {
  buildSignupConsentsPayload,
  type BuildSignupConsentsPayloadOptions,
} from '../shared/signupConsent.js';

export { buildSignupConsentsPayload, DEFAULT_AI_TRAINING_LABEL } from '../shared/signupConsent.js';
export type { BuildSignupConsentsPayloadOptions };

export interface RecordSignupConsentsActionInput {
  userId: string;
  aiTrainingGranted: boolean;
  apiBaseUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  includeMarketing?: boolean;
  marketingGranted?: boolean;
}

export type RecordSignupConsentsActionResult =
  | { ok: true; records: UserConsent[] }
  | { ok: false; error: string };

/** SOREN-callable: set explicit AI-training consent checkbox state. */
export async function setAiTrainingConsent(checked: boolean): Promise<boolean> {
  return checked;
}

/** SOREN-callable: flip AI-training consent checkbox state. */
export async function toggleAiTrainingConsent(current: boolean): Promise<boolean> {
  return !current;
}

/** POST signup consents built from hybrid signup UI state. */
export async function recordSignupConsentsAction(
  input: RecordSignupConsentsActionInput,
): Promise<RecordSignupConsentsActionResult> {
  const base = input.apiBaseUrl ?? '';
  const consents = buildSignupConsentsPayload({
    aiTrainingGranted: input.aiTrainingGranted,
    includeMarketing: input.includeMarketing,
    marketingGranted: input.marketingGranted,
  });

  try {
    const res = await fetch(`${base}/api/consent/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: input.userId,
        consents,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      }),
    });
    const data = (await res.json()) as UserConsent[] & { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? `Request failed (${res.status})` };
    }
    return { ok: true, records: data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const consentActions = {
  buildSignupConsentsPayload,
  setAiTrainingConsent,
  toggleAiTrainingConsent,
  recordSignupConsents: recordSignupConsentsAction,
};
