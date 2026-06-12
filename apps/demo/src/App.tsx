import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { QaInput } from './QaInput.js';
import {
  SorenActionCard,
  SorenConfirmRow,
  SorenMicButton,
  SorenNotifOnboarding,
  SorenOrb,
  SorenProvider,
  SorenQuickNote,
  scheduleDailyReminder,
  useSoren,
  type SorenAdapterConfig,
} from '@varshylinc/soren-react';

const ACTIVE_PROJECTS = 3;
const USER_FIRST_NAME = 'Sam';

const TOKEN_ENDPOINT = 'https://varshyl-voice-engine-production.up.railway.app/token';

interface JobSiteHandlers {
  onSaved: (text: string, photos: number) => void;
  onFiled: (text: string) => void;
}

function useJobSiteConfig({ onSaved, onFiled }: JobSiteHandlers): SorenAdapterConfig {
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
      // Mock of the host's daily-log creation endpoint.
      fileToDailyLog: async (note) => {
        await new Promise((r) => setTimeout(r, 400));
        onFiled(note);
      },
    }),
    [onSaved, onFiled],
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

function Stage({ savedNotes, dailyLog }: { savedNotes: string[]; dailyLog: string[] }): ReactElement {
  const { lastTranscript, lastResponse, pendingAction, proposeAction } = useSoren();
  const showConfirm = pendingAction?.type === 'confirm';

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

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <SorenNotifOnboarding />
      </div>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '2rem 0 1.25rem',
        }}
      >
        <SorenOrb fullBleed={false} />
        {showConfirm ? (
          <div
            style={{
              width: '100%',
              maxWidth: '24rem',
              background: 'var(--card)',
              color: 'var(--ink)',
              borderRadius: '0.75rem',
              padding: '1rem',
            }}
          >
            <SorenConfirmRow />
          </div>
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

      {dailyLog.length > 0 ? (
        <section style={{ marginTop: '1.25rem' }}>
          <h2 style={{ fontSize: '0.85rem', color: 'var(--sage)', marginBottom: '0.4rem' }}>Daily log</h2>
          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            {dailyLog.map((n, i) => (
              <li key={i} style={{ padding: '0.15rem 0' }}>
                {n}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <QaInput />

      <SorenMicButton />
    </main>
  );
}

export function App(): ReactElement {
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [dailyLog, setDailyLog] = useState<string[]>([]);
  const config = useJobSiteConfig({
    onSaved: (text, photos) =>
      setSavedNotes((prev) => [...prev, photos > 0 ? `${text} (${photos} photo)` : text]),
    onFiled: (text) => setDailyLog((prev) => [...prev, text]),
  });

  useEffect(() => {
    void scheduleDailyReminder(); // FEAT 5: arm the 3pm daily-log reminder
  }, []);

  return (
    <SorenProvider config={config} activeProjectCount={ACTIVE_PROJECTS} userFirstName={USER_FIRST_NAME}>
      <Stage savedNotes={savedNotes} dailyLog={dailyLog} />
    </SorenProvider>
  );
}
