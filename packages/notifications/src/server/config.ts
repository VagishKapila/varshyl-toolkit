export interface FcmCredentials {
  projectId: string;
  serviceAccount: Record<string, unknown>;
}

function parseServiceAccountJson(raw: string | undefined): Record<string, unknown> | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Read FCM credentials from env. Push stays disabled when unset. */
export function getFcmCredentialsFromEnv(): FcmCredentials | null {
  const serviceAccount = parseServiceAccountJson(process.env.FCM_SERVICE_ACCOUNT_JSON);
  const projectId =
    process.env.FCM_PROJECT_ID?.trim()
    || (typeof serviceAccount?.project_id === 'string' ? serviceAccount.project_id : undefined);
  if (!serviceAccount || !projectId) return null;
  return { projectId, serviceAccount };
}

export function isPushEnabledFromEnv(): boolean {
  return process.env.PUSH_ENABLED === 'true' && getFcmCredentialsFromEnv() != null;
}
