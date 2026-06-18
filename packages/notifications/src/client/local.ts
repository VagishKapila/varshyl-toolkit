/** Product-agnostic local notification scheduling (Capacitor). */

export type LocalNotificationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface LocalNotificationScheduleInput {
  at?: Date;
  every?: 'day' | 'week' | 'month' | 'year';
  on?: { hour: number; minute: number };
  repeats?: boolean;
  allowWhileIdle?: boolean;
}

export interface LocalNotificationPayload {
  id: number;
  title: string;
  body: string;
  schedule: LocalNotificationScheduleInput;
  extra?: Record<string, unknown>;
}

export async function isNativePlatform(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (!(await isNativePlatform())) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

export async function checkLocalNotificationPermission(): Promise<LocalNotificationPermission> {
  if (!(await isNativePlatform())) return 'unsupported';
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const result = await LocalNotifications.checkPermissions();
  if (result.display === 'granted') return 'granted';
  if (result.display === 'denied') return 'denied';
  return 'prompt';
}

export async function scheduleLocalNotifications(
  notifications: LocalNotificationPayload[],
): Promise<void> {
  if (!(await isNativePlatform()) || notifications.length === 0) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.schedule({
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      schedule: n.schedule,
      extra: n.extra,
    })),
  });
}

export async function cancelLocalNotifications(ids: number[]): Promise<void> {
  if (!(await isNativePlatform()) || ids.length === 0) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({
    notifications: ids.map((id) => ({ id })),
  });
}

export async function getPendingLocalNotifications(): Promise<unknown[]> {
  if (!(await isNativePlatform())) return [];
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const pending = await LocalNotifications.getPending();
  return pending.notifications ?? [];
}
