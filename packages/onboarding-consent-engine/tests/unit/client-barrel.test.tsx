/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import React from 'react';
import * as Client from '@varshylinc/onboarding-consent-engine/client';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

afterEach(() => {
  cleanup();
});

describe('@varshylinc/onboarding-consent-engine/client barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Client, 'ConsentCheckbox', 'function');
    expectNamedExport(Client, 'ConsentBlock', 'function');
    expectNamedExport(Client, 'WelcomeScreen', 'function');
    expectNamedExport(Client, 'EmptyState', 'function');
    expectNamedExport(Client, 'ConsentUpdateModal', 'function');
    expectNamedExport(Client, 'SignupConsentBlock', 'function');
    expectNamedExport(Client, 'SignupConsentTwoButton', 'function');
    expectNamedExport(Client, 'useSignupConsents', 'function');
    expectNamedExport(Client, 'consentActions', 'const');
    expectNamedExport(Client, 'buildSignupConsentsPayload', 'function');
    expectNamedExport(Client, 'setAiTrainingConsent', 'function');
    expectNamedExport(Client, 'toggleAiTrainingConsent', 'function');
    expectNamedExport(Client, 'recordSignupConsents', 'function');
    expectNamedExport(Client, 'recordSignupConsentsAction', 'function');
    expectNamedExport(Client, 'DEFAULT_AI_TRAINING_LABEL', 'const');
    expectNamedExport(Client, 'AI_TRAINING_CONSENT_KEY', 'const');
    expectNamedExport(Client, 'IMPLIED_SIGNUP_CONSENT_KEYS', 'const');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Client, 'createConsentModule');
    expectNotOnBarrel(Client, 'runMigrations');
    expectNotOnBarrel(Client, 'recordConsent');
  });

  it('renders exported React components without crashing', () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();

    render(
      <>
        <Client.EmptyState />
        <Client.ConsentCheckbox
          id="tos"
          checked={false}
          onChange={onChange}
          label="I agree"
        />
        <Client.SignupConsentTwoButton
          tosUrl="https://example.com/terms"
          privacyUrl="https://example.com/privacy"
          onSubmit={onSubmit}
        />
      </>,
    );

    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });
});
