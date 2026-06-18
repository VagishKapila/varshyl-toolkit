import { useState, type ReactElement } from 'react';
import { useSoren } from '@varshylinc/soren-react';

/** QA-only helper: simulate an incoming transcript without speaking. */
export function QaInput(): ReactElement {
  const { proposeAction } = useSoren();
  const [draft, setDraft] = useState('add a note: inspector confirmed Friday');

  return (
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
          onClick={() =>
            proposeAction({ type: 'quick_note', payload: { text: draft.replace(/^.*?note[:,]?\s*/i, '') } })
          }
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
  );
}
