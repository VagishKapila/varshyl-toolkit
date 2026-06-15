import { nextCardId, type SorenCard } from '../cards';
import type { SorenDeleteParams } from '../verbs';
import type { SorenVerbContext, SorenVerbResult } from '../server/adapter';
import { fail, infoResult, ok } from '../server/result';
import { toItem } from './helpers';
import type { SorenRecord, SorenStore } from './store';

function resolveTargets(store: SorenStore, p: SorenDeleteParams): SorenRecord[] {
  if (p.id) {
    const r = store.get(p.id);
    return r ? [r] : [];
  }
  if (p.query) {
    const res = store.query(p.query);
    return p.recordType ? res.filter((r) => r.type === p.recordType) : res;
  }
  if (p.recordType) return store.byType(p.recordType);
  return [];
}

const dismiss = { id: 'dismiss', label: 'OK', effect: { kind: 'client' as const, action: 'dismiss' }, style: 'secondary' as const };

/**
 * delete — ALWAYS confirm before destroying. `confirmed` is advisory only:
 * we re-resolve the target at execution time and refuse to delete blind on a
 * stale or double-tapped card (D3).
 */
export async function deleteVerb(
  store: SorenStore,
  params: SorenDeleteParams,
  _ctx: SorenVerbContext,
): Promise<SorenVerbResult> {
  try {
    if (!params.confirmed) {
      const targets = resolveTargets(store, params);
      if (targets.length === 0) {
        return infoResult("I couldn't find anything matching that to delete.", 'Nothing to delete');
      }
      if (targets.length === 1) {
        const t = targets[0];
        const card: SorenCard = {
          id: nextCardId('confirm'),
          kind: 'confirm',
          title: `Delete "${t.title}"?`,
          subtitle: "This can't be undone.",
          actions: [
            { id: 'confirm', label: 'Delete', style: 'danger', effect: { kind: 'invoke', verb: 'delete', params: { id: t.id, confirmed: true } } },
            { id: 'keep', label: 'Keep', style: 'secondary', effect: { kind: 'client', action: 'dismiss' } },
          ],
        };
        return ok(`Want me to delete "${t.title}", sir? Confirm and it's gone.`, card);
      }
      const slice = targets.slice(0, 6);
      const card: SorenCard = {
        id: nextCardId('disambig'),
        kind: 'disambiguate',
        title: 'Which one should I delete?',
        items: slice.map(toItem),
        actions: slice.map((t) => ({ id: t.id, label: t.title, effect: { kind: 'invoke', verb: 'delete', params: { id: t.id } } })),
      };
      return ok('I found a few matches — which one should I delete, sir?', card);
    }

    // confirmed → re-validate, never trust the flag as authority.
    if (!params.id) {
      return infoResult("I won't delete blind — point me at one item and I'll confirm.", 'Need a target');
    }
    const fresh = store.get(params.id);
    if (!fresh) {
      return infoResult("That one's already gone, or I can't find it now.", 'Already gone');
    }
    store.remove(fresh.id);
    return ok(`Done — I deleted "${fresh.title}".`, {
      id: nextCardId('info'),
      kind: 'info',
      title: `Deleted "${fresh.title}"`,
      actions: [dismiss],
    });
  } catch {
    return fail("I couldn't complete that delete just now, sir.");
  }
}
