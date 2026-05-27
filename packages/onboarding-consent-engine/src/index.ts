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
