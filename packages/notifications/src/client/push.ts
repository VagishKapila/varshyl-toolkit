import type { PushPlatform } from '../types.js';
import { isNativePlatform } from './local.js';

export interface PushRegistrationOptions {
  /** Called when APNs/FCM returns a device token — POST to your API. */
  onToken: (token: string, platform: PushPlatform) => void | Promise<void>;
  onError?: (error: unknown) => void;
}

let registrationStarted = false;

/**
 * Request push permission, register with APNs/FCM, and forward tokens via `onToken`.
 * Idempotent per app session. Attach listeners before `register()` (JobSite Intel pattern).
 */
export async function registerForPushNotifications(
  options: PushRegistrationOptions,
): Promise<() => void> {
  if (!(await isNativePlatform()) || registrationStarted) {
    return () => undefined;
  }
  registrationStarted = true;

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const { Capacitor } = await import('@capacitor/core');

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') {
    registrationStarted = false;
    return () => undefined;
  }

  const regHandle = await PushNotifications.addListener('registration', (event) => {
    const platform: PushPlatform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    void Promise.resolve(options.onToken(event.value, platform));
  });

  const errHandle = await PushNotifications.addListener('registrationError', (err) => {
    options.onError?.(err);
    registrationStarted = false;
  });

  await PushNotifications.register();

  return () => {
    void regHandle.remove();
    void errHandle.remove();
    registrationStarted = false;
  };
}

/** Test hook — reset session guard. */
export function resetPushRegistrationForTests(): void {
  registrationStarted = false;
}
