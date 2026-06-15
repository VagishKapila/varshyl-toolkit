import { nextCardId } from '../cards';
import { paginate } from '../pagination';
import type {
  SorenAttachParams,
  SorenCreateParams,
  SorenFileParams,
  SorenFindParams,
} from '../verbs';
import type { SorenAdapter, SorenCapabilities, SorenVerbContext, SorenVerbResult } from '../server/adapter';
import { fail, infoResult, ok, resultCard } from '../server/result';
import { deleteVerb } from './deleteVerb';
import { MEDIA_TYPES, inWindow, plural, toItem, whenPhrase } from './helpers';
import { seedReferenceStore, type SorenStore } from './store';

const CAPABILITIES: SorenCapabilities = {
  find: { types: ['photo', 'video', 'document', 'note', 'log', 'invoice', 'project'] },
  attach: { mediaTypes: ['photo', 'video', 'document', 'file'] },
  create: { recordTypes: ['note', 'project'] },
  file: { entryTypes: ['log', 'invoice'] },
  delete: { recordTypes: ['photo', 'video', 'document', 'note', 'log', 'invoice', 'project'] },
};

const dismissAction = { id: 'dismiss', label: 'OK', effect: { kind: 'client' as const, action: 'dismiss' }, style: 'secondary' as const };

function findVerb(store: SorenStore, p: SorenFindParams, ctx: SorenVerbContext): SorenVerbResult {
  try {
    const matches = store
      .byType(p.type)
      .filter((r) => inWindow(r.createdAt, p.when, ctx.now))
      .filter((r) => (p.filter ? r.title.toLowerCase().includes(p.filter.toLowerCase()) : true));
    const phrase = whenPhrase(p.when);
    if (matches.length === 0) {
      return infoResult(`I couldn't find any ${plural(p.type, 0)} ${phrase}, sir.`.trim(), 'Nothing found');
    }
    const { page, total } = paginate(matches, p.limit);
    const actions = MEDIA_TYPES.has(p.type)
      ? [
          {
            id: 'file_all',
            label: "File all to today's log",
            style: 'primary' as const,
            effect: {
              kind: 'invoke' as const,
              verb: 'file' as const,
              params: { entryType: 'log', payload: { mediaIds: page.map((r) => r.id), summary: `${page.length} ${plural(p.type, page.length)} ${phrase}`.trim() } },
            },
          },
          { id: 'review', label: 'Let me check', effect: { kind: 'client' as const, action: 'review' }, style: 'secondary' as const },
        ]
      : [dismissAction];
    const summary = `Found ${total} ${plural(p.type, total)} ${phrase}, sir.`.replace(/\s+/g, ' ').trim();
    return ok(summary, resultCard({ title: `${total} ${plural(p.type, total)} ${phrase}`.trim(), items: page.map(toItem), total, actions }));
  } catch {
    return fail(`I couldn't run that search just now, sir.`);
  }
}

function attachVerb(store: SorenStore, p: SorenAttachParams, _ctx: SorenVerbContext): SorenVerbResult {
  try {
    const title = p.note?.trim() || `New ${p.mediaType}`;
    const rec = store.insert({ type: p.mediaType, title, createdAt: Date.now(), fields: { source: p.source, target: p.target, mediaIds: p.mediaIds } });
    return ok(`Attached the ${p.mediaType}, sir.`, {
      id: nextCardId('result'),
      kind: 'result',
      title: 'Attached',
      items: [toItem(rec)],
      actions: [
        { id: 'file', label: "File to today's log", style: 'primary', effect: { kind: 'invoke', verb: 'file', params: { entryType: 'log', payload: { mediaIds: [rec.id] } } } },
        dismissAction,
      ],
    });
  } catch {
    return fail(`I couldn't attach that just now, sir.`);
  }
}

function createVerb(store: SorenStore, p: SorenCreateParams, _ctx: SorenVerbContext): SorenVerbResult {
  try {
    const title = String(p.fields.title ?? p.fields.name ?? `New ${p.recordType}`);
    const rec = store.insert({ type: p.recordType, title, createdAt: Date.now(), fields: p.fields });
    return ok(`Created a new ${p.recordType}, sir.`, {
      id: nextCardId('info'),
      kind: 'info',
      title: `Created "${rec.title}"`,
      actions: [dismissAction],
    });
  } catch {
    return fail(`I couldn't create that just now, sir.`);
  }
}

function fileVerb(store: SorenStore, p: SorenFileParams, _ctx: SorenVerbContext): SorenVerbResult {
  try {
    const isInvoice = p.entryType === 'invoice';
    const title = isInvoice ? 'Invoice' : 'Daily log';
    const rec = store.insert({ type: p.entryType, title: `${title} — just now`, createdAt: Date.now(), fields: p.payload });
    const speech = isInvoice ? 'Filed the invoice, sir.' : 'Filed to your daily log, sir.';
    return ok(speech, { id: nextCardId('info'), kind: 'info', title: `Filed "${rec.title}"`, actions: [dismissAction] });
  } catch {
    return fail(`I couldn't file that just now, sir.`);
  }
}

export interface ReferenceAdapterOptions {
  readonly store?: SorenStore;
  readonly productId?: string;
}

/**
 * THE EXAMPLE ADAPTER. Implements all 5 verbs against a simple in-memory store.
 * Copy this shape for a real product adapter; swap the store for the product's
 * authenticated back-end.
 */
export function createReferenceAdapter(options: ReferenceAdapterOptions = {}): SorenAdapter {
  const store = options.store ?? seedReferenceStore();
  return {
    productId: options.productId ?? 'soren-demo',
    capabilities: CAPABILITIES,
    find: (params, ctx) => Promise.resolve(findVerb(store, params, ctx)),
    attach: (params, ctx) => Promise.resolve(attachVerb(store, params, ctx)),
    create: (params, ctx) => Promise.resolve(createVerb(store, params, ctx)),
    file: (params, ctx) => Promise.resolve(fileVerb(store, params, ctx)),
    delete: (params, ctx) => deleteVerb(store, params, ctx),
  };
}
