export {
  ConsentCheckbox,
  ConsentBlock,
  WelcomeScreen,
  EmptyState,
  ConsentUpdateModal,
  SignupConsentBlock,
} from './components/index.js';
export type {
  ConsentCheckboxProps,
  ConsentBlockProps,
  WelcomeScreenProps,
  EmptyStateProps,
  ConsentUpdateModalProps,
  SignupConsentBlockProps,
} from './components/index.js';
export {
  consentActions,
  buildSignupConsentsPayload,
  setAiTrainingConsent,
  toggleAiTrainingConsent,
  recordSignupConsentsAction,
  DEFAULT_AI_TRAINING_LABEL,
  AI_TRAINING_CONSENT_KEY,
  IMPLIED_SIGNUP_CONSENT_KEYS,
} from './actions.js';
export type {
  BuildSignupConsentsPayloadOptions,
  RecordSignupConsentsActionInput,
  RecordSignupConsentsActionResult,
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
