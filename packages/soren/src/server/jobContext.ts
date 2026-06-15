import { AsyncLocalStorage } from 'node:async_hooks';
import type { SorenCard } from '../cards';
import type { SorenVerbContext } from './adapter';

/**
 * Per-job context the engine establishes for the lifetime of one LiveKit room
 * job. Extends the verb context with `publishCard`, which the skill bridge uses
 * to push result cards onto the room's data channel.
 */
export interface SorenJobContext extends SorenVerbContext {
  /** Publish a card to the room (bound by the engine to the LiveKit room). */
  publishCard?: (card: SorenCard) => Promise<void> | void;
}

const storage = new AsyncLocalStorage<SorenJobContext>();

/**
 * Run `fn` with the given job context active. The engine wraps each room
 * session so that verb `execute()` calls can read context without threading it
 * through Claude's tool-call signature (mirrors the engine's existing
 * AsyncLocalStorage pattern).
 */
export function runSorenJob<T>(ctx: SorenJobContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Read the active job context, or `undefined` outside a job. */
export function tryGetSorenContext(): SorenJobContext | undefined {
  return storage.getStore();
}

/** Read the active job context, throwing a clear error if missing. */
export function getSorenContext(): SorenJobContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error('[soren] no active job context — wrap the session in runSorenJob(ctx, fn)');
  }
  return ctx;
}
