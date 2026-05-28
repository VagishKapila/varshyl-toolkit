import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignInScreen, useAuth } from '@varshylinc/auth-social/client';
import {
  SignupConsentBlock,
  DEFAULT_AI_TRAINING_LABEL,
} from '@varshylinc/onboarding-consent-engine/client';
import { DemoShell } from '../components/DemoShell.js';

export function AuthPage(): React.ReactElement {
  const { actions } = useAuth();
  const [signUpMode, setSignUpMode] = useState(false);
  const [aiTrainingChecked, setAiTrainingChecked] = useState(false);

  return (
    <DemoShell title="auth-social — Sign in / Sign up">
      <div className="mb-4 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setSignUpMode(false)}
          className="rounded px-3 py-1 border"
          style={{ borderColor: signUpMode ? '#E8DFD0' : '#8B3A2F', backgroundColor: signUpMode ? '#FFFDF8' : '#8B3A2F', color: signUpMode ? '#211D18' : '#FFFDF8' }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setSignUpMode(true)}
          className="rounded px-3 py-1 border"
          style={{ borderColor: signUpMode ? '#8B3A2F' : '#E8DFD0', backgroundColor: signUpMode ? '#8B3A2F' : '#FFFDF8', color: signUpMode ? '#FFFDF8' : '#211D18' }}
        >
          Create account
        </button>
      </div>
      <SignInScreen
        actions={actions}
        signUpMode={signUpMode}
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
      <p className="mt-4 text-xs text-center" style={{ color: '#B8893E' }}>
        Try the password eye toggle on the password field. Demo accepts any email/password after sign-up.
      </p>
      <p className="mt-2 text-sm text-center">
        <Link to="/auth/forgot" style={{ color: '#8B3A2F' }}>
          Forgot password flow →
        </Link>
      </p>
    </DemoShell>
  );
}
