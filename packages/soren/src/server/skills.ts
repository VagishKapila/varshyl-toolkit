import { failureCard } from '../cards';
import type { SorenVerbName } from '../verbs';
import { implementedVerbs, type SorenAdapter, type SorenVerbContext, type SorenVerbResult } from './adapter';
import { getSorenContext, type SorenJobContext } from './jobContext';
import { verbDescription, verbInputSchema } from './schemas';

/**
 * Shape of a tool the engine consumes (structurally identical to the engine's
 * `SkillTool`): `execute(input)` runs server-side and returns a plain string,
 * which Claude rewrites conversationally → ElevenLabs → spoken.
 */
export interface SorenSkillTool {
  readonly name: string;
  readonly description: string;
  readonly input_schema: Record<string, unknown>;
  execute(input: Record<string, unknown>): Promise<string>;
}

const GRACEFUL_THROW =
  'I ran into a problem handling that, sir. Give me a moment and try once more.';

function runVerb(
  adapter: SorenAdapter,
  verb: SorenVerbName,
  input: Record<string, unknown>,
  ctx: SorenVerbContext,
): Promise<SorenVerbResult> {
  // Implemented verbs are filtered upstream, so the method is present.
  const fn = adapter[verb] as (
    p: Record<string, unknown>,
    c: SorenVerbContext,
  ) => Promise<SorenVerbResult>;
  return fn.call(adapter, input, ctx);
}

async function publish(ctx: SorenJobContext, card: SorenVerbResult['card']): Promise<void> {
  if (card && ctx.publishCard) await ctx.publishCard(card);
}

/**
 * Bridge a {@link SorenAdapter} into engine-ready tools — one per implemented
 * verb. Each tool reads the active job context (set via `runSorenJob`), invokes
 * the verb, publishes any card to the room, and returns the spoken line.
 *
 * Defense-in-depth: an unhandled throw is converted to graceful speech + an
 * info card so Soren never goes silent.
 */
export function buildSorenSkills(adapter: SorenAdapter): SorenSkillTool[] {
  return implementedVerbs(adapter).map((verb) => ({
    name: verb,
    description: verbDescription(verb, adapter.capabilities),
    input_schema: verbInputSchema(verb, adapter.capabilities),
    async execute(input: Record<string, unknown>): Promise<string> {
      const ctx = getSorenContext();
      try {
        const result = await runVerb(adapter, verb, input ?? {}, ctx);
        await publish(ctx, result.card);
        return result.speech;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.error(`[soren] verb "${verb}" threw:`, message);
        await publish(ctx, failureCard(`The ${verb} step failed unexpectedly.`));
        return GRACEFUL_THROW;
      }
    },
  }));
}
