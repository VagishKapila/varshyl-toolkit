import { useMemo, useState, type ReactElement } from 'react';
import {
  SorenActionCard,
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

function Row({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.35rem 0' }}>
      <span style={{ color: 'var(--sage)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Stage({ savedNotes }: { savedNotes: string[] }): ReactElement {
  const { state, connection, lastTranscript, lastResponse, proposeAction } = useSoren();
  const [draft, setDraft] = useState('add a note: inspector confirmed Friday');

  return (
    <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '1.5rem 1.25rem 8rem' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Soren · JobSite Intel</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--sage)' }}>Day-1 voice loop demo</p>
      </header>

      <section
        style={{
          background: 'color-mix(in srgb, var(--sage) 12%, var(--surface))',
          borderRadius: '0.875rem',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
        }}
      >
        <Row label="Connection" value={connection} />
        <Row label="Voice state" value={state} />
        <Row label="You said" value={lastTranscript ?? '—'} />
        <Row label="Soren said" value={lastResponse ?? '—'} />
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--sage)', marginBottom: '0.4rem' }}>
          Simulate a transcript (QA fallback)
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--sage)',
              background: 'var(--surface)',
              color: 'var(--ink)',
            }}
          />
          <button
            type="button"
            onClick={() => proposeAction({ type: 'quick_note', payload: { text: draft.replace(/^.*?note[:,]?\s*/i, '') } })}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--soren-1)',
              color: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {state === 'listening' || state === 'speaking' ? <SorenWaveform /> : null}
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
          <h2 style={{ fontSize: '0.9rem', color: 'var(--sage)' }}>Saved notes</h2>
          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            {savedNotes.map((n, i) => (
              <li key={i} style={{ padding: '0.15rem 0' }}>
                {n}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
