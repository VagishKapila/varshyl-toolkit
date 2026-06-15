/**
 * Card-first result surface.
 *
 * Cards are the PRIMARY result surface for Soren, not an error fallback.
 * After Soren acts (server-side, via a verb), he speaks a short line AND
 * hands the client a card carrying the tap options. Disambiguation and
 * yes/no confirms reuse the same card shape.
 */
import type { SorenVerbName } from './verbs';

/**
 * - `result`      — outcome of a verb (e.g. "Found 12 photos from today").
 * - `confirm`     — yes/no gate before a side effect (always used for delete).
 * - `disambiguate`— "which one?" — items are the choices.
 * - `info`        — neutral / handled-failure notice (see {@link failureCard}).
 */
export type SorenCardKind = 'result' | 'confirm' | 'disambiguate' | 'info';

/** A button effect when a card action is tapped. */
export type SorenCardActionEffect =
  /** Round-trips to the engine: Claude re-runs `verb(params)` and replies in character. */
  | { readonly kind: 'invoke'; readonly verb: SorenVerbName; readonly params: Record<string, unknown> }
  /** Browser-only directive (no server turn): dismiss, open camera, pick a file, etc. */
  | { readonly kind: 'client'; readonly action: string; readonly data?: Record<string, unknown> };

export type SorenCardActionStyle = 'primary' | 'secondary' | 'danger';

export interface SorenCardAction {
  readonly id: string;
  readonly label: string;
  readonly effect: SorenCardActionEffect;
  readonly style?: SorenCardActionStyle;
}

export interface SorenCardItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly thumbnailUrl?: string;
  readonly meta?: Record<string, string | number>;
}

/** Pagination / counts surfaced on big lists — see `pagination.ts`. */
export interface SorenCardMeta {
  readonly shown?: number;
  readonly total?: number;
  readonly [key: string]: string | number | undefined;
}

export interface SorenCard {
  readonly id: string;
  readonly kind: SorenCardKind;
  readonly title: string;
  readonly subtitle?: string;
  readonly items?: readonly SorenCardItem[];
  readonly actions?: readonly SorenCardAction[];
  readonly meta?: SorenCardMeta;
}

/**
 * LiveKit data-channel topics. The engine publishes cards on `card`; the
 * client posts the tapped action back on `action`.
 */
export const SOREN_TOPICS = {
  card: 'soren-card',
  action: 'soren-action',
} as const;

/** Posted by the client when a card action is tapped. */
export interface SorenActionMessage {
  readonly cardId: string;
  readonly actionId: string;
  readonly effect: SorenCardActionEffect;
}

let cardSeq = 0;
/** Stable-ish id for a freshly built card. */
export function nextCardId(prefix = 'card'): string {
  cardSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${cardSeq}`;
}

/**
 * Handled-failure convention. A verb that fails gracefully returns an `info`
 * card built here, paired with characterful speech — never an unhandled throw.
 */
export function failureCard(message: string, title = 'I hit a snag'): SorenCard {
  return {
    id: nextCardId('fail'),
    kind: 'info',
    title,
    subtitle: message,
    actions: [{ id: 'dismiss', label: 'OK', effect: { kind: 'client', action: 'dismiss' }, style: 'secondary' }],
  };
}
