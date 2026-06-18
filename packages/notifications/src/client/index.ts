export type { PushPlatform } from '../types.js';
export type { LocalNotificationPermission } from './local.js';
export {
  isNativePlatform,
  requestLocalNotificationPermission,
  checkLocalNotificationPermission,
  scheduleLocalNotifications,
  cancelLocalNotifications,
  getPendingLocalNotifications,
} from './local.js';
export type {
  LocalNotificationScheduleInput,
  LocalNotificationPayload,
} from './local.js';
export {
  registerForPushNotifications,
  resetPushRegistrationForTests,
} from './push.js';
export type { PushRegistrationOptions } from './push.js';
