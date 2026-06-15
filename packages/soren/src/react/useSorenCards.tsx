import { useCallback, useState } from 'react';
import type { SorenCard, SorenCardAction } from '../cards';
import type { SorenVerbName } from '../verbs';

export interface SorenVerbRunResult {
  readonly speech: string;
  readonly card?: SorenCard;
}

/** Runs a verb and returns its result. In the live app this is a round-trip to
 * the engine; in the harness it calls the reference adapter directly. */
export type SorenVerbRunner = (verb: SorenVerbName, params: Record<string, unknown>) => Promise<SorenVerbRunResult>;

export interface UseSorenCardsOptions {
  /** Handle non-dismiss client directives (e.g. "open_camera", "review"). */
  readonly onClient?: (action: string, data: Record<string, unknown> | undefined, card: SorenCard) => void;
}

export interface SorenCardsApi {
  readonly card: SorenCard | null;
  readonly speech: string | null;
  readonly busy: boolean;
  present(card: SorenCard, speech?: string): void;
  dispatch(action: SorenCardAction, card: SorenCard): void;
  clear(): void;
}

/**
 * Manages the visible card + speech and dispatches tapped actions. `invoke`
 * actions run the verb and present the resulting card; `client` actions either
 * dismiss or are forwarded to {@link UseSorenCardsOptions.onClient}.
 */
export function useSorenCards(run: SorenVerbRunner, options: UseSorenCardsOptions = {}): SorenCardsApi {
  const [card, setCard] = useState<SorenCard | null>(null);
  const [speech, setSpeech] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { onClient } = options;

  const present = useCallback((next: SorenCard, line?: string) => {
    setCard(next);
    if (line !== undefined) setSpeech(line);
  }, []);

  const clear = useCallback(() => setCard(null), []);

  const dispatch = useCallback(
    (action: SorenCardAction, source: SorenCard) => {
      const { effect } = action;
      if (effect.kind === 'client') {
        if (effect.action === 'dismiss') clear();
        else onClient?.(effect.action, effect.data, source);
        return;
      }
      setBusy(true);
      run(effect.verb, effect.params)
        .then((result) => {
          setSpeech(result.speech);
          setCard(result.card ?? null);
        })
        .finally(() => setBusy(false));
    },
    [run, clear, onClient],
  );

  return { card, speech, busy, present, dispatch, clear };
}
