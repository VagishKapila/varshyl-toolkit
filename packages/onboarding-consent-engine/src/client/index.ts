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
} from './actions.js';
export type {
  BuildSignupConsentsPayloadOptions,
  RecordSignupConsentsActionInput,
  RecordSignupConsentsActionResult,
} from './actions.js';
export type {
  ConsentDefinition,
  ConsentStatus,
  AuditEntry,
} from '../shared/types.js';
