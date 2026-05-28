export {
  runMigrations,
  seedStandardConsents,
  createConsentModule,
  STANDARD_CONSENTS,
  applyProductName,
} from './server/index.js';

export type {
  ConsentDefinition,
  UserConsent,
  ConsentVersionLog,
  RecordConsentInput,
  RecordSignupConsentsInput,
  ConsentStatus,
  AuditEntry,
  ConsentModuleAdapter,
  ConsentModuleConfig,
  ConsentModule,
} from './shared/types.js';

export {
  buildSignupConsentsPayload,
  DEFAULT_AI_TRAINING_LABEL,
  IMPLIED_SIGNUP_CONSENT_KEYS,
  AI_TRAINING_CONSENT_KEY,
} from './shared/signupConsent.js';
export type {
  BuildSignupConsentsPayloadOptions,
  SignupConsentEntry,
} from './shared/signupConsent.js';
