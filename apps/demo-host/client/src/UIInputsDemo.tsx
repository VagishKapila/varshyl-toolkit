import React, { useState } from 'react';
import {
  VarshylTextInput,
  VarshylEmailInput,
  VarshylAddressInput,
  VarshylSearchInput,
  VarshylPasswordInput,
} from '@varshylinc/ui-inputs/react';
import { T, inputStyle, FieldLabel, DemoCard, CopyInstallButton } from './UIInputsDemoParts.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PasswordDemo({ value, onChange }: { value: string; onChange: (v: string) => void }): React.ReactElement {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <VarshylPasswordInput
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Min 8 characters"
        style={{ ...inputStyle, paddingRight: 72 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: T.sage, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export function UIInputsDemoPage(): React.ReactElement {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [formJson, setFormJson] = useState('');

  const emailValid = email.length > 0 && EMAIL_RE.test(email);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !address || !search) {
      setFormError('Please fill in all fields');
      setFormJson('');
      return;
    }
    setFormError('');
    setFormJson(JSON.stringify({ name, email, password, address, search }, null, 2));
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.cream, padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>@varshylinc/ui-inputs</h1>
          <p style={{ color: T.muted, fontSize: 14, margin: '0 0 16px' }}>
            5 typed React input components with mobile keyboard defaults. Works with any React app.
          </p>
          <CopyInstallButton />
        </header>

        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>All 5 components — live and interactive</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
          <DemoCard name="VarshylTextInput" propsNote="textarea · autocorrect=on · spellcheck · autocapitalize=sentences">
            <FieldLabel>Full Name</FieldLabel>
            <VarshylTextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
            <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>Value: {name || '(empty)'}</div>
          </DemoCard>

          <DemoCard name="VarshylEmailInput" propsNote='type="email" · autocomplete="email" · autocorrect=off'>
            <FieldLabel>Email Address</FieldLabel>
            <VarshylEmailInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
            <div style={{ marginTop: 8, fontSize: 12 }}>{email ? (emailValid ? '✅ valid' : '❌ invalid') : 'Type to validate'}</div>
          </DemoCard>

          <DemoCard name="VarshylPasswordInput" propsNote='type="password" · autocomplete="current-password"'>
            <FieldLabel>Password</FieldLabel>
            <PasswordDemo value={password} onChange={setPassword} />
            <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>{password.length} characters</div>
          </DemoCard>

          <DemoCard name="VarshylAddressInput" propsNote='type="text" · autocomplete="street-address" · autocapitalize=words'>
            <FieldLabel>Job Site Address</FieldLabel>
            <VarshylAddressInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, State" style={inputStyle} />
          </DemoCard>

          <DemoCard name="VarshylSearchInput" propsNote='type="search" · autocorrect=off · spellcheck=false'>
            <FieldLabel>Search Projects</FieldLabel>
            <VarshylSearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type to search..." style={inputStyle} />
            <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>Value: {search || '(empty)'}</div>
          </DemoCard>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>All 5 together in a real sign up form</h2>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><FieldLabel>Full Name</FieldLabel><VarshylTextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" style={{ ...inputStyle, minHeight: 56 }} /></div>
            <div><FieldLabel>Email Address</FieldLabel><VarshylEmailInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} /></div>
            <div><FieldLabel>Password</FieldLabel><PasswordDemo value={password} onChange={setPassword} /></div>
            <div><FieldLabel>Job Site Address</FieldLabel><VarshylAddressInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, State" style={inputStyle} /></div>
            <div><FieldLabel>Search Projects</FieldLabel><VarshylSearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type to search..." style={inputStyle} /></div>
            {formError && <p style={{ color: T.error, fontSize: 13, margin: 0 }}>{formError}</p>}
            <button type="submit" style={{ width: '100%', background: T.sage, color: T.ink, border: 'none', borderRadius: 8, padding: '12px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Submit Form</button>
          </form>
          {formJson && (
            <pre style={{ marginTop: 16, background: T.codeBg, color: T.ok, padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto', fontFamily: 'ui-monospace, monospace' }}>{formJson}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
