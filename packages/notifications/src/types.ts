/** Supported native push platforms (FCM handles both Android and iOS delivery). */
export type PushPlatform = 'ios' | 'android';

/** Stored device token row — product-agnostic shape. */
export interface DeviceToken {
  userId: string;
  orgId: string;
  platform: PushPlatform;
  token: string;
  announcementsOptIn: boolean;
  createdAt: Date;
}

export interface RegisterDeviceTokenInput {
  userId: string;
  orgId: string;
  platform: PushPlatform;
  token: string;
  announcementsOptIn?: boolean;
}

export interface UnregisterDeviceTokenInput {
  userId: string;
  orgId: string;
  token: string;
}

/** Filter for {@link listEligibleTokens} — Hub broadcast passes `announcementsOptIn: true`. */
export interface EligibleTokenFilter {
  orgId?: string;
  userId?: string;
  platform?: PushPlatform;
  announcementsOptIn?: boolean;
}

export interface PushMessage {
  title: string;
  body: string;
  /** String key/value payload delivered to the native client. */
  data?: Record<string, string>;
  /** Deep-link route (also copied to `data.route` when absent). */
  route?: string;
  /** APNs notification category (action buttons). */
  category?: string;
}

export interface DeliveryReport {
  sent: number;
  failed: number;
  failedTokens: string[];
}

/**
 * Platform-agnostic token persistence — implement with Postgres via
 * {@link createPgDeviceTokenStore} or wire your own backing store.
 */
export interface DeviceTokenStore {
  register(input: RegisterDeviceTokenInput): Promise<void>;
  unregister(input: UnregisterDeviceTokenInput): Promise<void>;
  listEligible(filter?: EligibleTokenFilter): Promise<DeviceToken[]>;
  tokensForUser(userId: string, orgId: string): Promise<string[]>;
  removeTokens(tokens: string[]): Promise<void>;
}
