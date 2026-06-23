import React from 'react';

export const T = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  border: '#2a2a2a',
  sage: '#7C9B8A',
  cream: '#FBF8F1',
  ink: '#2D3B36',
  label: '#e5e5e5',
  inputBg: '#141414',
  inputBorder: '#333',
  muted: '#9ca3af',
  error: '#ef4444',
  ok: '#10b981',
  codeBg: '#0a0a0a',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: T.inputBg,
  border: `1px solid ${T.inputBorder}`,
  borderRadius: 8,
  padding: '10px 12px',
  color: T.cream,
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box',
};

export function FieldLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <label style={{ display: 'block', color: T.label, fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
      {children}
    </label>
  );
}

export function DemoCard({
  name,
  propsNote,
  children,
  footer,
}: {
  name: string;
  propsNote: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', color: T.sage, fontSize: 13, marginBottom: 12 }}>{name}</div>
      {children}
      {footer && <div style={{ marginTop: 10, fontSize: 12, color: T.muted }}>{footer}</div>}
      <div style={{ marginTop: 10, fontSize: 11, color: T.muted, fontFamily: 'ui-monospace, monospace' }}>{propsNote}</div>
    </div>
  );
}

export function CopyInstallButton(): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const cmd = 'pnpm add @varshylinc/ui-inputs';

  const copy = async () => {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <code style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: T.cream }}>
        {cmd}
      </code>
      <button type="button" onClick={() => { void copy(); }} style={{ background: T.sage, color: T.ink, border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
