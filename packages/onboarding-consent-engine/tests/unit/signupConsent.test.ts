import { describe, it, expect } from 'vitest';
import {
  buildSignupConsentsPayload,
  DEFAULT_AI_TRAINING_LABEL,
  IMPLIED_SIGNUP_CONSENT_KEYS,
  AI_TRAINING_CONSENT_KEY,
} from '../../src/shared/signupConsent.js';

describe('buildSignupConsentsPayload', () => {
  it('always grants implied ToS and Privacy consents', () => {
    const payload = buildSignupConsentsPayload({ aiTrainingGranted: false });
    for (const key of IMPLIED_SIGNUP_CONSENT_KEYS) {
      const entry = payload.find((c) => c.key === key);
      expect(entry?.granted).toBe(true);
    }
  });

  it('records ai_training separately and reflects checkbox (default unchecked)', () => {
    const unchecked = buildSignupConsentsPayload({ aiTrainingGranted: false });
    expect(unchecked.find((c) => c.key === AI_TRAINING_CONSENT_KEY)?.granted).toBe(false);

    const checked = buildSignupConsentsPayload({ aiTrainingGranted: true });
    expect(checked.find((c) => c.key === AI_TRAINING_CONSENT_KEY)?.granted).toBe(true);
  });

  it('does not bundle ai_training into implied consent keys', () => {
    expect(IMPLIED_SIGNUP_CONSENT_KEYS).not.toContain(AI_TRAINING_CONSENT_KEY);
    const payload = buildSignupConsentsPayload({ aiTrainingGranted: false });
    expect(payload).toHaveLength(3);
    expect(payload.map((c) => c.key)).toEqual([
      'terms_of_service',
      'privacy_policy',
      AI_TRAINING_CONSENT_KEY,
    ]);
  });

  it('optionally includes marketing when requested', () => {
    const payload = buildSignupConsentsPayload({
      aiTrainingGranted: false,
      includeMarketing: true,
      marketingGranted: true,
    });
    expect(payload.find((c) => c.key === 'marketing_emails')?.granted).toBe(true);
  });
});

describe('DEFAULT_AI_TRAINING_LABEL', () => {
  it('matches owner-approved signup copy', () => {
    expect(DEFAULT_AI_TRAINING_LABEL).toBe(
      'Help improve construction intelligence by sharing your anonymized project data.',
    );
  });
});
