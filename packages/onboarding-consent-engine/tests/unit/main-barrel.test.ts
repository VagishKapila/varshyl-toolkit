import { describe, it } from 'vitest';
import * as Main from '@varshylinc/onboarding-consent-engine';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/onboarding-consent-engine main barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Main, 'runMigrations', 'function');
    expectNamedExport(Main, 'seedStandardConsents', 'function');
    expectNamedExport(Main, 'createConsentModule', 'function');
    expectNamedExport(Main, 'createOcePool', 'function');
    expectNamedExport(Main, 'oceSelfTest', 'function');
    expectNamedExport(Main, 'STANDARD_CONSENTS', 'const');
    expectNamedExport(Main, 'applyProductName', 'function');
    expectNamedExport(Main, 'OceError', 'class');
    expectNamedExport(Main, 'DEFAULT_OCE_CONNECTION_TIMEOUT_MS', 'const');
    expectNamedExport(Main, 'DEFAULT_OCE_OPERATION_TIMEOUT_MS', 'const');
    expectNamedExport(Main, 'buildSignupConsentsPayload', 'function');
    expectNamedExport(Main, 'DEFAULT_AI_TRAINING_LABEL', 'const');
    expectNamedExport(Main, 'IMPLIED_SIGNUP_CONSENT_KEYS', 'const');
    expectNamedExport(Main, 'AI_TRAINING_CONSENT_KEY', 'const');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Main, 'SignupConsentTwoButton');
    expectNotOnBarrel(Main, 'consentActions');
    expectNotOnBarrel(Main, 'recordConsent');
  });
});
