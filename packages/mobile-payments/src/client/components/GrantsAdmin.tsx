import { useState, type FormEvent } from 'react';
import { useGrants } from '../hooks/useGrants.js';
import { grantsAdminStyles as s } from './grantsAdminStyles.js';

export interface GrantsAdminProps {
  productSlug: string;
  apiUrl: string;
  currentAdminId: string;
  className?: string;
}

function accessLabel(expiresAt: Date | null): string {
  return expiresAt ? `Expires ${expiresAt.toLocaleDateString()}` : 'Permanent';
}

export function GrantsAdmin({
  productSlug,
  apiUrl,
  currentAdminId,
  className,
}: GrantsAdminProps): JSX.Element {
  const grantsApi = useGrants({ productSlug, apiUrl });
  const [grantUserId, setGrantUserId] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [grantPermanent, setGrantPermanent] = useState(true);
  const [grantDays, setGrantDays] = useState(30);
  const [grantSuccess, setGrantSuccess] = useState(false);
  const [codeValue, setCodeValue] = useState('');
  const [codePermanent, setCodePermanent] = useState(true);
  const [codeDays, setCodeDays] = useState(30);
  const [codeMaxUses, setCodeMaxUses] = useState<string>('');

  const onGrant = async (e: FormEvent) => {
    e.preventDefault();
    setGrantSuccess(false);
    await grantsApi.grantAccess({
      userId: grantUserId.trim(),
      reason: grantReason.trim(),
      permanent: grantPermanent,
      days: grantPermanent ? undefined : grantDays,
      grantedBy: currentAdminId,
    });
    setGrantUserId('');
    setGrantReason('');
    setGrantSuccess(true);
  };

  const onCreateCode = async (e: FormEvent) => {
    e.preventDefault();
    await grantsApi.createPromoCode({
      code: codeValue.trim(),
      permanent: codePermanent,
      days: codePermanent ? undefined : codeDays,
      maxUses: codeMaxUses.trim() ? Number(codeMaxUses) : undefined,
      createdBy: currentAdminId,
    });
    setCodeValue('');
    setCodeMaxUses('');
  };

  return (
    <div style={s.root} className={className}>
      {grantsApi.error ? <p style={s.error}>{grantsApi.error}</p> : null}

      <section style={s.section}>
        <h2 style={s.heading}>Active Grants</h2>
        {grantsApi.grants.length === 0 ? (
          <p style={s.empty}>No active grants. Use the form below to grant access.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['User ID', 'Reason', 'Access', 'Granted By', ''].map((h) => (
                  <th key={h || 'actions'} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grantsApi.grants.map((g, i) => (
                <tr key={g.id} style={i % 2 ? s.rowAlt : undefined}>
                  <td style={s.td}>{g.userId}</td>
                  <td style={s.td}>{g.reason ?? '—'}</td>
                  <td style={s.td}>{accessLabel(g.expiresAt)}</td>
                  <td style={s.td}>{g.grantedBy}</td>
                  <td style={s.td}>
                    <button
                      type="button"
                      style={s.dangerBtn}
                      disabled={grantsApi.loading}
                      onClick={() => {
                        if (window.confirm(`Revoke access for ${g.userId}?`)) {
                          void grantsApi.revokeAccess(g.userId);
                        }
                      }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={s.section}>
        <h2 style={s.heading}>Grant Access</h2>
        <form onSubmit={(e) => void onGrant(e)}>
          <label style={s.field}>
            <span style={s.label}>User ID</span>
            <input style={s.input} required value={grantUserId} onChange={(ev) => setGrantUserId(ev.target.value)} />
          </label>
          <label style={s.field}>
            <span style={s.label}>Reason</span>
            <input
              style={s.input}
              placeholder="e.g. founder friend, beta tester"
              value={grantReason}
              onChange={(ev) => setGrantReason(ev.target.value)}
            />
          </label>
          <div style={s.toggleRow}>
            <button type="button" style={s.toggleBtn(grantPermanent)} onClick={() => setGrantPermanent(true)}>Permanent</button>
            <button type="button" style={s.toggleBtn(!grantPermanent)} onClick={() => setGrantPermanent(false)}>Time-limited</button>
          </div>
          {!grantPermanent ? (
            <label style={s.field}>
              <span style={s.label}>Days of access</span>
              <input style={s.input} type="number" min={1} value={grantDays} onChange={(ev) => setGrantDays(Number(ev.target.value))} />
            </label>
          ) : null}
          <button type="submit" style={s.primaryBtn} disabled={grantsApi.loading}>Grant Access</button>
          {grantSuccess ? <p style={s.success}>✅ Access granted</p> : null}
        </form>
      </section>

      <section style={s.section}>
        <h2 style={s.heading}>Promo Codes</h2>
        {grantsApi.promoCodes.length === 0 ? (
          <p style={s.empty}>No promo codes yet.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>{['Code', 'Uses/Max', 'Access', 'Expires', ''].map((h) => <th key={h || 'a'} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {grantsApi.promoCodes.map((c, i) => (
                <tr key={c.id} style={i % 2 ? s.rowAlt : undefined}>
                  <td style={{ ...s.td, ...s.mono }}>{c.code}</td>
                  <td style={s.td}>{c.uses}/{c.maxUses ?? '∞'}</td>
                  <td style={s.td}>{c.grantsPermanent ? 'Permanent' : `${c.grantsDays ?? 0} days`}</td>
                  <td style={s.td}>{c.expiresAt ? c.expiresAt.toLocaleDateString() : '—'}</td>
                  <td style={s.td}>
                    <button type="button" style={s.dangerBtn} disabled={grantsApi.loading} onClick={() => void grantsApi.revokePromoCode(c.id)}>Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={s.section}>
        <h2 style={s.heading}>Create Promo Code</h2>
        <form onSubmit={(e) => void onCreateCode(e)}>
          <label style={s.field}>
            <span style={s.label}>Code</span>
            <input
              style={{ ...s.input, ...s.mono }}
              required
              value={codeValue}
              onChange={(ev) => setCodeValue(ev.target.value)}
              onBlur={(ev) => setCodeValue(ev.target.value.toUpperCase())}
            />
          </label>
          <div style={s.toggleRow}>
            <button type="button" style={s.toggleBtn(codePermanent)} onClick={() => setCodePermanent(true)}>Permanent</button>
            <button type="button" style={s.toggleBtn(!codePermanent)} onClick={() => setCodePermanent(false)}>Time-limited</button>
          </div>
          {!codePermanent ? (
            <label style={s.field}>
              <span style={s.label}>Days of access</span>
              <input style={s.input} type="number" min={1} value={codeDays} onChange={(ev) => setCodeDays(Number(ev.target.value))} />
            </label>
          ) : null}
          <label style={s.field}>
            <span style={s.label}>Max uses</span>
            <input style={s.input} type="number" min={1} placeholder="Leave blank for unlimited" value={codeMaxUses} onChange={(ev) => setCodeMaxUses(ev.target.value)} />
          </label>
          <button type="submit" style={s.primaryBtn} disabled={grantsApi.loading}>Create Code</button>
        </form>
      </section>
    </div>
  );
}
