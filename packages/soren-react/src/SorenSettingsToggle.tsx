import { type CSSProperties, type ReactElement } from 'react';
import type { SorenVoiceSettings } from '@varshylinc/soren-core';
import { useSoren } from './SorenProvider.js';
import { tokens } from './styles.js';

export interface SorenSettingsToggleProps {
  className?: string;
  style?: CSSProperties;
}

const PROFILES: Array<SorenVoiceSettings['voiceProfile']> = ['calm', 'direct', 'friendly'];

function Row({ label, children }: { label: string; children: ReactElement }): ReactElement {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
      {children}
    </label>
  );
}

/** Settings panel: enable/disable, read-aloud, and voice-profile selection. */
export function SorenSettingsToggle({ className, style }: SorenSettingsToggleProps): ReactElement {
  const { settings, updateSettings } = useSoren();

  const panelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    background: tokens.surface,
    color: tokens.onSurface,
    maxWidth: '20rem',
    ...style,
  };

  return (
    <div data-soren-settings="" className={className} style={panelStyle}>
      <Row label="Voice enabled">
        <input
          type="checkbox"
          data-soren-setting="enabled"
          checked={settings.enabled}
          onChange={(e) => updateSettings({ enabled: e.target.checked })}
        />
      </Row>
      <Row label="Read replies aloud">
        <input
          type="checkbox"
          data-soren-setting="readAloud"
          checked={settings.readAloud}
          disabled={!settings.enabled}
          onChange={(e) => updateSettings({ readAloud: e.target.checked })}
        />
      </Row>
      <Row label="Voice profile">
        <select
          data-soren-setting="voiceProfile"
          value={settings.voiceProfile}
          disabled={!settings.enabled}
          onChange={(e) =>
            updateSettings({ voiceProfile: e.target.value as SorenVoiceSettings['voiceProfile'] })
          }
          style={{ background: 'transparent', color: 'inherit', border: `1px solid ${tokens.muted}`, borderRadius: '0.375rem', padding: '0.25rem 0.5rem' }}
        >
          {PROFILES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Row>
    </div>
  );
}
