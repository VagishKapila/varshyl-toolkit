import type { SorenCard } from '../cards';
import type {
  SorenAttachParams,
  SorenCreateParams,
  SorenDeleteParams,
  SorenFileParams,
  SorenFindParams,
  SorenMediaType,
  SorenVerbName,
} from '../verbs';

/**
 * Per-session context handed to every verb. The engine binds `userToken`
 * (from the LiveKit room token) and `now`; adapters use these to call the
 * product's authenticated back-end. Browser-safe (no Node imports here).
 */
export interface SorenVerbContext {
  readonly productId: string;
  readonly userToken?: string | null;
  readonly now: Date;
}

/**
 * What a verb returns. `speech` is a plain string the engine's Claude rewrites
 * conversationally → TTS. `card` is the result surface (optional but expected
 * for most verbs).
 */
export interface SorenVerbResult {
  readonly speech: string;
  readonly card?: SorenCard;
}

/**
 * Declares which values each verb accepts, so the engine can build accurate
 * JSON-Schema enums and tool descriptions without the adapter hand-writing them.
 */
export interface SorenCapabilities {
  readonly find?: { readonly types: readonly string[] };
  readonly attach?: { readonly mediaTypes: readonly SorenMediaType[] };
  readonly create?: { readonly recordTypes: readonly string[] };
  readonly file?: { readonly entryTypes: readonly string[] };
  readonly delete?: { readonly recordTypes: readonly string[] };
}

/**
 * A product adapter: server-side implementation of the 5 verbs. Implement only
 * the verbs the product supports — `buildSorenSkills` emits a tool per verb
 * present. Every method should return a {@link SorenVerbResult} and handle its
 * own failures gracefully (see `result.ts` `fail`).
 */
export interface SorenAdapter {
  readonly productId: string;
  readonly capabilities: SorenCapabilities;
  find?(params: SorenFindParams, ctx: SorenVerbContext): Promise<SorenVerbResult>;
  attach?(params: SorenAttachParams, ctx: SorenVerbContext): Promise<SorenVerbResult>;
  create?(params: SorenCreateParams, ctx: SorenVerbContext): Promise<SorenVerbResult>;
  file?(params: SorenFileParams, ctx: SorenVerbContext): Promise<SorenVerbResult>;
  delete?(params: SorenDeleteParams, ctx: SorenVerbContext): Promise<SorenVerbResult>;
}

/** Verbs this adapter actually implements, in canonical order. */
export function implementedVerbs(adapter: SorenAdapter): SorenVerbName[] {
  const order: SorenVerbName[] = ['find', 'attach', 'create', 'file', 'delete'];
  return order.filter((v) => typeof adapter[v] === 'function');
}
