import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import { sorenSpeak } from '@varshylinc/soren-core';
import { sizes, tokens } from './styles.js';

const ONBOARDED_KEY = 'soren_notif_onboarded';
const DAILY_KEY = 'soren_notif_daily';
const PROMPT =
  'Hey — want me to remind you to file your daily log at 3pm each day? ' +
  'I can also brief you each morning on your active projects.';

export interface SorenNotifOnboardingProps {
  className?: string;
  style?: CSSProperties;
}

function alreadyOnboarded(): boolean {
  try {
    return typeof localStorage === 'undefined' || localStorage.getItem(ONBOARDED_KEY) === 'true';
  } catch {
    return true; // storage blocked — don't nag
  }
}

function persist(daily: boolean): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    if (daily) localStorage.setItem(DAILY_KEY, 'true');
  } catch {
    /* storage unavailable */
  }
}

/**
 * First-launch notification opt-in. When `soren_notif_onboarded` is unset, Soren
 * speaks the prompt (via sorenSpeak) and shows Yes/No. "Yes" requests
 * Notification permission and flags daily reminders on; "No" just records that
 * onboarding happened. Renders nothing once handled.
 */
export function SorenNotifOnboarding({ className, style }: SorenNotifOnboardingProps): ReactElement | null {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (alreadyOnboarded()) return;
    setShow(true);
    void sorenSpeak(PROMPT);
  }, []);

  if (!show) return null;

  const onYes = async (): Promise<void> => {
    if (typeof Notification !== 'undefined') {
      try {
        await Notification.requestPermission();
      } catch {
        /* user dismissed */
      }
    }
    persist(true);
    setShow(false);
  };
  const onNo = (): void => {
    persist(false);
    setShow(false);
  };

  const btn = (primary: boolean): CSSProperties => ({
    flex: 1,
    minHeight: sizes.tapMin,
    padding: '0.6rem 0.875rem',
    borderRadius: '0.5rem',
    border: primary ? 'none' : `1px solid ${tokens.muted}`,
    background: primary ? tokens.accent : 'transparent',
    color: primary ? tokens.onAccent : 'inherit',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  });

  return (
    <div
      data-soren-notif-onboarding=""
      role="dialog"
      aria-label="Notification setup"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        borderRadius: '0.75rem',
        background: tokens.surface,
        color: tokens.onSurface,
        maxWidth: '24rem',
        ...style,
      }}
    >
      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.4 }}>{PROMPT}</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={() => void onYes()} style={btn(true)}>
          Yes, remind me
        </button>
        <button type="button" onClick={onNo} style={btn(false)}>
          No thanks
        </button>
      </div>
    </div>
  );
}
