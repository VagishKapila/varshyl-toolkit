import { failureCard, nextCardId, type SorenCard, type SorenCardItem } from '../cards';
import { paginationMeta, showingSubtitle } from '../pagination';
import type { SorenVerbResult } from './adapter';

/** A successful verb result: spoken line + optional card. */
export function ok(speech: string, card?: SorenCard): SorenVerbResult {
  return card ? { speech, card } : { speech };
}

/**
 * Handled failure as a first-class result. Produces an `info` card + a
 * characterful spoken line. Use this in every verb's catch block so a failure
 * never surfaces as an unhandled throw.
 */
export function fail(speech: string, cardMessage?: string): SorenVerbResult {
  return { speech, card: failureCard(cardMessage ?? speech) };
}

/** Neutral notice card (e.g. "Nothing to show"). */
export function infoResult(speech: string, title: string, subtitle?: string): SorenVerbResult {
  return {
    speech,
    card: {
      id: nextCardId('info'),
      kind: 'info',
      title,
      subtitle,
      actions: [{ id: 'dismiss', label: 'OK', effect: { kind: 'client', action: 'dismiss' }, style: 'secondary' }],
    },
  };
}

export interface ResultCardInput {
  readonly title: string;
  readonly items: readonly SorenCardItem[];
  /** Total before pagination, for the "showing N of M" convention. */
  readonly total: number;
  readonly actions?: SorenCard['actions'];
  readonly subtitle?: string;
}

/** Build a `result` card with pagination meta wired in. */
export function resultCard(input: ResultCardInput): SorenCard {
  const shown = input.items.length;
  return {
    id: nextCardId('result'),
    kind: 'result',
    title: input.title,
    subtitle: input.subtitle ?? showingSubtitle(shown, input.total),
    items: input.items,
    actions: input.actions,
    meta: paginationMeta(shown, input.total),
  };
}
