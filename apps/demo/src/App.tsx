import { useMemo, useState, type ReactElement } from 'react';
import {
  SorenActionCard,
  SorenAvatar,
  SorenMicButton,
  SorenProvider,
  SorenQuickNote,
  SorenWaveform,
  useSoren,
  type SorenAdapterConfig,
} from '@varshylinc/soren-react';

const TOKEN_ENDPOINT = 'https://varshyl-voice-engine-production.up.railway.app/token';

function useJobSiteConfig(onSaved: (text: string, photos: number) => void): SorenAdapterConfig {
  return useMemo<SorenAdapterConfig>(
    () => ({
      productId: 'jobsite-intel',
      apiBaseUrl: 'https://varshyl-voice-engine-production.up.railway.app',
      tokenEndpoint: TOKEN_ENDPOINT,
      getAuthToken: () => null, // DEV: engine mints anonymous tokens
      tools: [],
      saveQuickNote: async (text, photoUrls) => {
        await new Promise((r) => setTimeout(r, 400)); // mock host latency
        onSaved(text, photoUrls?.length ?? 0);
      },
    }),
    [onSaved],
  );
}

function Bubble({ who, text }: { who: 'You' | 'Soren'; text: string }): ReactElement {
  const mine = who === 'You';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '80%',
          padding: '0.55rem 0.8rem',
          borderRadius: '0.9rem',
          background: mine ? 'var(--sage)' : 'var(--card)',
          color: mine ? '#fff' : 'var(--ink)',
          fontSize: '0.92rem',
        }}
      >
        <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.15rem' }}>{who}</span>
        {text}
      </div>
    </div>
  );
}

function Stage({ savedNotes }: { savedNotes: string[] }): ReactElement {
  const { state, lastTranscript, lastResponse, proposeAction } = useSoren();
  const [draft, setDraft] = useState('add a note: inspector confirmed Friday');

  return (
    <main style={{ maxWidth: '30rem', margin: '0 auto', padding: '1.5rem 1.25rem 8rem' }}>
      <p
        style={{
          margin: '0 0 1rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--sage)',
        }}
      >
        JobSite Intel
      </p>

      <section
        style={{
          background: 'var(--card)',
          borderRadius: '1.25rem',
          padding: '1.75rem 1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <SorenAvatar />
        {state === 'listening' || state === 'speaking' ? (
          <SorenWaveform style={{ width: '60%' }} />
        ) : null}
      </section>

      {lastTranscript || lastResponse ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {lastTranscript ? <Bubble who="You" text={lastTranscript} /> : null}
          {lastResponse ? <Bubble who="Soren" text={lastResponse} /> : null}
        </section>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <SorenQuickNote />
        <SorenActionCard
          title="Which project?"
          options={[
            { label: 'Maple Street Tower', value: 'maple' },
            { label: 'Riverside Bridge', value: 'riverside' },
          ]}
          onSelect={(v) => proposeAction({ type: 'disambiguate', payload: { value: v } })}
        />
      </div>

      {savedNotes.length > 0 ? (
        <section style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '0.85rem', color: 'var(--sage)', marginBottom: '0.4rem' }}>Saved notes</h2>
          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            {savedNotes.map((n, i) => (
              <li key={i} style={{ padding: '0.15rem 0' }}>
                {n}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section style={{ marginTop: '2rem', opacity: 0.6 }}>
        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--sage)', marginBottom: '0.3rem' }}>
          QA only — simulate a transcript
        </label>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{
              flex: 1,
              fontSize: '0.8rem',
              padding: '0.45rem 0.6rem',
              borderRadius: '0.45rem',
              border: '1px solid var(--sage)',
              background: 'var(--surface)',
              color: 'var(--ink)',
            }}
          />
          <button
            type="button"
            onClick={() => proposeAction({ type: 'quick_note', payload: { text: draft.replace(/^.*?note[:,]?\s*/i, '') } })}
            style={{
              fontSize: '0.8rem',
              padding: '0.45rem 0.7rem',
              borderRadius: '0.45rem',
              border: 'none',
              background: 'var(--sage)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </section>

      <SorenMicButton />
    </main>
  );
}

export function App(): ReactElement {
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const config = useJobSiteConfig((text, photos) =>
    setSavedNotes((prev) => [...prev, photos > 0 ? `${text} (${photos} photo)` : text]),
  );

  return (
    <SorenProvider config={config}>
      <Stage savedNotes={savedNotes} />
    </SorenProvider>
  );
}
