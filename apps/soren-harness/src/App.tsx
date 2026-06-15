import { useMemo, useState } from 'react';
import { createReferenceAdapter } from '@varshylinc/soren/reference';
import { SorenCardView, useSorenCards, type SorenVerbRunner } from '@varshylinc/soren/react';
import type { SorenVerbName } from '@varshylinc/soren';

interface Utterance {
  readonly label: string;
  readonly verb: SorenVerbName;
  readonly params: Record<string, unknown>;
}

const UTTERANCES: Utterance[] = [
  { label: 'Soren, get my photos from today', verb: 'find', params: { type: 'photo', when: 'today' } },
  { label: 'Soren, find my projects', verb: 'find', params: { type: 'project', when: 'all' } },
  { label: 'Soren, add a site photo', verb: 'attach', params: { mediaType: 'photo', note: 'Site photo', source: 'camera' } },
  { label: 'Soren, note: inspector confirmed Friday', verb: 'create', params: { recordType: 'note', fields: { title: 'Inspector confirmed Friday' } } },
  { label: "Soren, file today's log", verb: 'file', params: { entryType: 'log', payload: { summary: 'End of day' } } },
  { label: 'Soren, delete my note', verb: 'delete', params: { recordType: 'note' } },
];

export function App(): JSX.Element {
  // The reference adapter IS the example back-end — it saves to a seeded
  // in-memory store (see packages/soren/src/reference/store.ts).
  const adapter = useMemo(() => createReferenceAdapter(), []);

  const run: SorenVerbRunner = useMemo(
    () => (verb, params) => {
      const fn = adapter[verb];
      return fn
        ? fn(params as never, { productId: 'soren-demo', now: new Date() })
        : Promise.resolve({ speech: "I can't do that yet, sir." });
    },
    [adapter],
  );

  const cards = useSorenCards(run, {
    onClient: (action) => {
      if (action === 'review') window.alert('(harness) opening the reviewer…');
    },
  });

  const [status, setStatus] = useState('Tap a request below');

  const ask = async (u: Utterance) => {
    setStatus('Thinking…');
    const result = await run(u.verb, u.params);
    if (result.card) cards.present(result.card, result.speech);
    setStatus('Tap to continue');
  };

  return (
    <main className="harness">
      <div className="orb" data-busy={cards.busy} aria-hidden>
        S
      </div>
      <h1 className="name">Soren</h1>
      <p className="status">{cards.busy ? 'Thinking…' : status}</p>

      {cards.speech ? <p className="speech">{cards.speech}</p> : null}

      {cards.card ? (
        <div className="card-slot">
          <SorenCardView card={cards.card} onAction={cards.dispatch} />
        </div>
      ) : null}

      <section className="utterances">
        <h2>Say to Soren</h2>
        {UTTERANCES.map((u) => (
          <button key={u.label} type="button" className="say" disabled={cards.busy} onClick={() => ask(u)}>
            {u.label}
          </button>
        ))}
      </section>
    </main>
  );
}
