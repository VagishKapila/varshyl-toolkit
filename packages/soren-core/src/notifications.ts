/**
 * Reminder + briefing scheduling. Browser-targeted but import-safe in Node/SSR
 * (every browser global is guarded). No backend required for the in-session
 * paths.
 */
import { sorenSpeak } from './speech.js';

const DAILY_KEY = 'soren_notif_daily';
const REMINDER_TEXT = 'Time to file your daily log. Tap to open Soren.';
const SW_URL = '/sw.soren.js';
const DAILY_LOG_HOUR = 15; // 3pm local

let reminderTimer: ReturnType<typeof setTimeout> | null = null;

function msUntilNext(hour: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function readFlag(key: string): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

/**
 * Schedule the daily 3pm "file your daily log" reminder. Requires the user to
 * have opted in (`soren_notif_daily`) and granted Notification permission.
 * Registers the Service Worker for notification display + click handling and
 * (re)arms a timer for the next 3pm; falls back to an in-page Notification timer
 * when no SW is available.
 *
 * TODO(web-push): for delivery while the app is closed, wire Web Push with a
 * VAPID server. The timer path only fires while a tab/SW is alive.
 */
export async function scheduleDailyReminder(hour = DAILY_LOG_HOUR): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!readFlag(DAILY_KEY)) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  let registration: ServiceWorkerRegistration | null = null;
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register(SW_URL);
    } catch {
      registration = null;
    }
  }

  const fire = (): void => {
    if (registration) {
      void registration.showNotification('Soren', { body: REMINDER_TEXT, tag: 'soren-daily-log' });
    } else {
      try {
        new Notification('Soren', { body: REMINDER_TEXT });
      } catch {
        /* construction blocked */
      }
    }
    arm(); // reschedule for the following day
  };

  const arm = (): void => {
    if (reminderTimer) clearTimeout(reminderTimer);
    reminderTimer = setTimeout(fire, msUntilNext(hour));
  };
  arm();
}

/**
 * Speak a one-line morning briefing if it's between 6am–10am local, there's at
 * least one active project, and we haven't briefed yet today. Returns whether a
 * briefing fired. Once-per-day is enforced via a `soren_briefing_YYYY-MM-DD` key.
 */
export function maybeMorningBriefing(activeProjectCount: number, firstName?: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!activeProjectCount || activeProjectCount <= 0) return false;

  const now = new Date();
  if (now.getHours() < 6 || now.getHours() >= 10) return false;

  const key = `soren_briefing_${now.toISOString().slice(0, 10)}`;
  try {
    if (typeof localStorage !== 'undefined') {
      if (localStorage.getItem(key) === 'true') return false;
      localStorage.setItem(key, 'true');
    }
  } catch {
    return false;
  }

  const name = firstName ? ` ${firstName}` : '';
  void sorenSpeak(`Good morning${name}. You have ${activeProjectCount} active projects today.`);
  return true;
}
