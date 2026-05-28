import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignInScreen, useAuth } from '@varshylinc/auth-social/client';
import {
  SignupConsentBlock,
  DEFAULT_AI_TRAINING_LABEL,
} from '@varshylinc/onboarding-consent-engine/client';
import { DemoShell } from '../components/DemoShell.js';

export function ConsentSignupPage(): React.ReactElement {
  const { actions } = useAuth();
  const [aiTrainingChecked, setAiTrainingChecked] = useState(false);

  return (
    <DemoShell title="onboarding-consent-engine — Signup consent block">
      <p className="text-sm mb-4 max-w-lg" style={{ color: '#B8893E' }}>
        Locked hybrid UX: implied Terms/Privacy links (no checkbox) + one separate optional
        AI-training checkbox, unchecked by default.
      </p>
      <SignInScreen
        actions={actions}
        signUpMode
        forgotPasswordUrl="/auth/forgot"
        consentSlot={
          <SignupConsentBlock
            termsUrl="https://example.com/terms"
            privacyUrl="https://example.com/privacy"
            aiTrainingChecked={aiTrainingChecked}
            onAiTrainingChange={setAiTrainingChecked}
            aiTrainingLabel={DEFAULT_AI_TRAINING_LABEL}
            learnMoreUrl="https://example.com/ai-training"
            actionPhrase="signing in"
          />
        }
      />
      <p className="mt-4 text-sm text-center">
        <Link to="/" style={{ color: '#8B3A2F' }}>
          ← All screens
        </Link>
      </p>
    </DemoShell>
  );
}
