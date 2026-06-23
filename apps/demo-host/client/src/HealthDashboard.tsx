import React, { useCallback, useMemo, useState } from 'react';

type HealthStatus = 'pass' | 'fail' | 'skip';

interface HealthCheckResult {
  check: string;
  status: HealthStatus;
  duration: number;
  detail?: string;
}

const COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  border: '#2a2a2a',
  pass: '#10b981',
  fail: '#ef4444',
  skip: '#f59e0b',
  sage: '#7C9B8A',
  muted: '#9ca3af',
  text: '#f3f4f6',
};

const TOTAL_CHECKS = 23;

function statusIcon(status: HealthStatus): string {
  if (status === 'pass') return '✅';
  if (status === 'fail') return '❌';
  return '⚠️';
}

export function HealthDashboardPage(): React.ReactElement {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const summary = useMemo(() => {
    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;
    const skipped = results.filter((r) => r.status === 'skip').length;
    const autoTotal = results.filter((r) => r.status !== 'skip').length;
    const autoPass = results.filter((r) => r.status === 'pass').length;
    const allAutoPass = autoTotal === 19 && autoPass === 19 && failed === 0;
    return { passed, failed, skipped, allAutoPass };
  }, [results]);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setResults([]);
    try {
      const res = await fetch('/api/health/run');
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let readResult = await reader.read();
      while (!readResult.done) {
        buffer += decoder.decode(readResult.value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const item = JSON.parse(trimmed) as HealthCheckResult;
          setResults((prev) => [...prev, item]);
        }
        readResult = await reader.read();
      }
      if (buffer.trim()) {
        const item = JSON.parse(buffer.trim()) as HealthCheckResult;
        setResults((prev) => [...prev, item]);
      }
      setLastRun(new Date());
    } catch (err) {
      setResults([{
        check: 'health-dashboard: stream error',
        status: 'fail',
        duration: 0,
        detail: err instanceof Error ? err.message : String(err),
      }]);
    } finally {
      setRunning(false);
    }
  }, []);

  const progress = running
    ? Math.round((results.length / TOTAL_CHECKS) * 100)
    : results.length > 0 ? 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Varshyl Toolkit — Health Dashboard
          </h1>
          <p style={{ color: COLORS.muted, fontSize: '0.875rem', marginBottom: '1rem' }}>
            9 packages · 23 checks · @varshylinc
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { void runChecks(); }}
              disabled={running}
              style={{
                background: COLORS.sage,
                color: '#0f0f0f',
                border: 'none',
                borderRadius: 8,
                padding: '0.5rem 1rem',
                fontWeight: 600,
                cursor: running ? 'not-allowed' : 'pointer',
                opacity: running ? 0.6 : 1,
              }}
            >
              {running ? 'Running…' : 'Run All Checks'}
            </button>
            {lastRun && (
              <span style={{ color: COLORS.muted, fontSize: '0.75rem' }}>
                Last run: {lastRun.toLocaleString()}
              </span>
            )}
          </div>
        </header>

        {(running || results.length > 0) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: COLORS.muted, marginBottom: '0.35rem' }}>
              <span>{running ? `Running… ${results.length}/${TOTAL_CHECKS}` : 'Complete'}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, background: COLORS.border, borderRadius: 999 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: COLORS.sage, borderRadius: 999, transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {results.map((r) => (
            <li
              key={r.check}
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: '0.75rem 1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span>{statusIcon(r.status)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{r.check}</span>
                    {r.status === 'skip' && (
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, color: COLORS.skip, border: `1px solid ${COLORS.skip}`, borderRadius: 4, padding: '0.1rem 0.35rem' }}>
                        MANUAL
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: COLORS.muted }}>{r.duration}ms</span>
                  </div>
                  {r.detail && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: COLORS.muted }}>{r.detail}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {!running && results.length === TOTAL_CHECKS && (
          <footer style={{ marginTop: '1.5rem', padding: '1rem', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              {summary.passed} passed · {summary.failed} failed · {summary.skipped} manual
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: summary.failed > 0 ? COLORS.fail : COLORS.pass }}>
              {summary.failed > 0
                ? `❌ ${summary.failed} checks need attention`
                : summary.allAutoPass
                  ? '✅ All automated checks passed'
                  : '✅ Automated checks finished'}
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
