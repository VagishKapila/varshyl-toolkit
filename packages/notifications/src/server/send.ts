import type {
  DeliveryReport,
  DeviceTokenStore,
  PushMessage,
} from '../types.js';
import type { FcmCredentials } from './config.js';
import { getFcmCredentialsFromEnv, isPushEnabledFromEnv } from './config.js';
import { sendFcmMulticast } from './fcm.js';

export interface PushSendOptions {
  /** FCM credentials. Defaults to env (`FCM_SERVICE_ACCOUNT_JSON`, `FCM_PROJECT_ID`, `PUSH_ENABLED=true`). */
  credentials?: FcmCredentials | null;
  /** When false, sends are no-ops (default: env `PUSH_ENABLED`). */
  enabled?: boolean;
  /** Remove stale tokens from the store after send failures. */
  store?: DeviceTokenStore;
}

function buildDataPayload(message: PushMessage): Record<string, string> {
  const data: Record<string, string> = { ...(message.data ?? {}) };
  if (message.route && !data.route) {
    data.route = message.route;
  }
  return data;
}

function resolveOptions(options: PushSendOptions = {}): {
  enabled: boolean;
  credentials: FcmCredentials | null;
} {
  const enabled = options.enabled ?? isPushEnabledFromEnv();
  const credentials = options.credentials === undefined
    ? getFcmCredentialsFromEnv()
    : options.credentials;
  return { enabled, credentials };
}

function toDeliveryReport(result: {
  sent: number;
  failed: number;
  invalidTokens: string[];
}): DeliveryReport {
  return {
    sent: result.sent,
    failed: result.failed,
    failedTokens: result.invalidTokens,
  };
}

/**
 * Send a push notification to every device token registered for one user.
 * Used for transactional alerts (report ready, billing, etc.).
 */
export async function sendPush(
  store: DeviceTokenStore,
  userId: string,
  orgId: string,
  message: PushMessage,
  options: PushSendOptions = {},
): Promise<DeliveryReport> {
  const { enabled, credentials } = resolveOptions(options);
  if (!enabled || !credentials) {
    return { sent: 0, failed: 0, failedTokens: [] };
  }

  const tokens = await store.tokensForUser(userId, orgId);
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, failedTokens: [] };
  }

  const result = await sendFcmMulticast(credentials, {
    tokens,
    title: message.title,
    body: message.body,
    data: buildDataPayload(message),
    category: message.category,
  });

  if (result.invalidTokens.length > 0) {
    await store.removeTokens(result.invalidTokens);
  }

  return toDeliveryReport(result);
}

/**
 * Send to an explicit token list — Varshyl Hub Broadcast calls this with
 * tokens from {@link listEligibleTokens} (`announcementsOptIn: true`).
 */
export async function sendPushToSegment(
  tokens: string[],
  message: PushMessage,
  options: PushSendOptions = {},
): Promise<DeliveryReport> {
  const { enabled, credentials } = resolveOptions(options);
  if (!enabled || !credentials || tokens.length === 0) {
    return { sent: 0, failed: 0, failedTokens: [] };
  }

  const uniqueTokens = [...new Set(tokens)];
  const result = await sendFcmMulticast(credentials, {
    tokens: uniqueTokens,
    title: message.title,
    body: message.body,
    data: buildDataPayload(message),
    category: message.category,
  });

  if (result.invalidTokens.length > 0 && options.store) {
    await options.store.removeTokens(result.invalidTokens);
  }

  return toDeliveryReport(result);
}
