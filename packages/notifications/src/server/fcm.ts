import type { App } from 'firebase-admin/app';
import type { Messaging } from 'firebase-admin/messaging';
import type { FcmCredentials } from './config.js';

let adminApp: App | null = null;
let messagingClient: Messaging | null = null;

export interface FcmSendInput {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
  category?: string;
}

export interface FcmSendResult {
  sent: number;
  failed: number;
  invalidTokens: string[];
}

async function getMessaging(credentials: FcmCredentials): Promise<Messaging | null> {
  if (messagingClient) return messagingClient;

  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getMessaging: getMessagingFn } = await import('firebase-admin/messaging');

  const existingApps = getApps();
  if (!existingApps || existingApps.length === 0) {
    adminApp = initializeApp({
      credential: cert(credentials.serviceAccount as Parameters<typeof cert>[0]),
      projectId: credentials.projectId,
    });
  }

  messagingClient = getMessagingFn(adminApp ?? existingApps[0]!);
  return messagingClient;
}

/** Send via Firebase Admin (FCM multicast — Android + iOS). */
export async function sendFcmMulticast(
  credentials: FcmCredentials,
  input: FcmSendInput,
): Promise<FcmSendResult> {
  const messaging = await getMessaging(credentials);
  if (!messaging || input.tokens.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  const invalidTokens: string[] = [];
  let sent = 0;
  let failed = 0;
  const batchSize = 500;

  for (let i = 0; i < input.tokens.length; i += batchSize) {
    const batch = input.tokens.slice(i, i + batchSize);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: input.title,
          body: input.body,
        },
        data: input.data,
        ...(input.category
          ? {
              apns: {
                payload: {
                  aps: {
                    category: input.category,
                    sound: 'default',
                  },
                },
              },
            }
          : {}),
        android: {
          priority: 'high',
        },
      });

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((res, idx) => {
        if (res.success) return;
        const code = res.error?.code ?? '';
        const token = batch[idx];
        if (!token) return;
        if (
          code === 'messaging/invalid-registration-token'
          || code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(token);
        }
      });
    } catch {
      failed += batch.length;
    }
  }

  return { sent, failed, invalidTokens };
}

/** Test hook — reset cached Firebase clients between tests. */
export function resetFcmClientForTests(): void {
  adminApp = null;
  messagingClient = null;
}
