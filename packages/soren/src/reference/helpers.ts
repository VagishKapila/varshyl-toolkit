import type { SorenCardItem } from '../cards';
import type { SorenWhen } from '../verbs';
import type { SorenRecord } from './store';

export const MEDIA_TYPES = new Set(['photo', 'video', 'document', 'file']);

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** Does `createdAt` fall inside the requested window relative to `now`? */
export function inWindow(createdAt: number, when: SorenWhen | undefined, now: Date): boolean {
  if (!when || when === 'all') return true;
  const today = startOfDay(now);
  switch (when) {
    case 'today':
      return createdAt >= today;
    case 'yesterday':
      return createdAt >= today - DAY && createdAt < today;
    case 'this_week':
      return createdAt >= today - 6 * DAY;
    case 'this_month':
      return createdAt >= today - 29 * DAY;
    default:
      return true;
  }
}

export function whenPhrase(when: SorenWhen | undefined): string {
  switch (when) {
    case 'today':
      return 'from today';
    case 'yesterday':
      return 'from yesterday';
    case 'this_week':
      return 'from this week';
    case 'this_month':
      return 'from this month';
    case undefined:
    case 'all':
      return '';
    default:
      return `for "${when}"`;
  }
}

export function toItem(rec: SorenRecord): SorenCardItem {
  return {
    id: rec.id,
    title: rec.title,
    subtitle: new Date(rec.createdAt).toLocaleString(),
    thumbnailUrl: rec.thumbnailUrl,
    meta: { type: rec.type },
  };
}

/** Pluralise a type label for speech ("photo" → "photos"). */
export function plural(type: string, n: number): string {
  if (n === 1) return type;
  return type.endsWith('s') ? type : `${type}s`;
}
