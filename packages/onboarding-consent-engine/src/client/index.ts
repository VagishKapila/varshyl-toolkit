export {
  ConsentCheckbox,
  ConsentBlock,
  WelcomeScreen,
  EmptyState,
  ConsentUpdateModal,
  SignupConsentBlock,
  SignupConsentTwoButton,
} from './components/index.js';
export type {
  ConsentCheckboxProps,
  ConsentBlockProps,
  WelcomeScreenProps,
  EmptyStateProps,
  ConsentUpdateModalProps,
  SignupConsentBlockProps,
  SignupConsentTwoButtonProps,
} from './components/index.js';
export { useSignupConsents } from './hooks/useSignupConsents.js';
export type {
  UseSignupConsentsOptions,
  RecordSignupConsentsParams,
} from './hooks/useSignupConsents.js';
export {
  consentActions,
  buildSignupConsentsPayload,
  setAiTrainingConsent,
  toggleAiTrainingConsent,
  recordSignupConsents,
  recordSignupConsentsAction,
  DEFAULT_AI_TRAINING_LABEL,
  AI_TRAINING_CONSENT_KEY,
  IMPLIED_SIGNUP_CONSENT_KEYS,
} from './actions.js';
export type {
  BuildSignupConsentsPayloadOptions,
  RecordSignupConsentsActionInput,
  RecordSignupConsentsActionResult,
  RecordSignupConsentsClientParams,
  SignupConsentEntry,
} from './actions.js';
export type {
  ConsentDefinition,
  ConsentStatus,
  AuditEntry,
  UserConsent,
  ConsentVersionLog,
  RecordConsentInput,
  RecordSignupConsentsInput,
} from '../shared/types.js';
