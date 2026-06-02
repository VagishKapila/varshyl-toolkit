export {
  runMigrations,
  seedStandardConsents,
  createConsentModule,
  createOcePool,
  oceSelfTest,
  STANDARD_CONSENTS,
  applyProductName,
  OceError,
  DEFAULT_OCE_CONNECTION_TIMEOUT_MS,
  DEFAULT_OCE_OPERATION_TIMEOUT_MS,
} from './server/index.js';

export type {
  RunMigrationsOptions,
  OceSelfTestResult,
  OceSelfTestOptions,
  OceErrorCode,
  CreateOcePoolOptions,
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
