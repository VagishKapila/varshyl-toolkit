export interface ConsentDefinition {
  id: number;
  key: string;
  version: number;
  required: boolean;
  display_text: string;
  legal_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserConsent {
  id: number;
  user_id: string;
  definition_id: number;
  version: number;
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  consented_at: Date;
}

export interface ConsentVersionLog {
  id: number;
  definition_id: number;
  old_version: number;
  new_version: number;
  old_text: string;
  new_text: string;
  changed_at: Date;
  changed_by: string | null;
}

export interface RecordConsentInput {
  userId: string;
  definitionId: number;
  version: number;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface RecordSignupConsentsInput {
  userId: string;
  consents: Array<{ key: string; granted: boolean }>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentStatus {
  key: string;
  version: number;
  granted: boolean;
  consented_at: Date;
}

export interface AuditEntry {
  id: number;
  user_id: string;
  key: string;
  version: number;
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  consented_at: Date;
}

export interface ConsentModuleAdapter {
  onConsentRecorded?: (userId: string, key: string, granted: boolean) => void | Promise<void>;
}

export interface ConsentModuleConfig {
  pool: import('pg').Pool;
  adapter?: ConsentModuleAdapter;
}

export interface ConsentModule {
  recordConsent(input: RecordConsentInput): Promise<UserConsent>;
  recordSignupConsents(input: RecordSignupConsentsInput): Promise<UserConsent[]>;
  hasUserConsented(userId: string, key: string): Promise<boolean>;
  needsConsentUpdate(userId: string): Promise<ConsentDefinition[]>;
  getCurrentConsents(userId: string): Promise<ConsentStatus[]>;
  getAuditTrail(userId: string, limit?: number): Promise<AuditEntry[]>;
  getUserLatestConsents(userIds: string[]): Promise<Map<string, ConsentStatus[]>>;
}
