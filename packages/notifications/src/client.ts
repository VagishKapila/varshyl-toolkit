export type { PushPlatform } from './types.js';
export type { LocalNotificationPermission } from './client/index.js';
export {
  isNativePlatform,
  requestLocalNotificationPermission,
  checkLocalNotificationPermission,
  scheduleLocalNotifications,
  cancelLocalNotifications,
  getPendingLocalNotifications,
  registerForPushNotifications,
  resetPushRegistrationForTests,
} from './client/index.js';
export type {
  LocalNotificationScheduleInput,
  LocalNotificationPayload,
  PushRegistrationOptions,
} from './client/index.js';
