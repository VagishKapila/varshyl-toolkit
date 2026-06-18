import { type CSSProperties, type ReactElement } from 'react';
import { sizes, tokens } from './styles.js';

export interface SorenActionOption {
  label: string;
  value: string;
}

export interface SorenActionCardProps {
  title: string;
  options: SorenActionOption[];
  onSelect: (value: string) => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Disambiguation card. Instead of asking "which project?" verbally, Soren can
 * surface tappable options. Selecting one fires `onSelect(value)`.
 */
export function SorenActionCard({
  title,
  options,
  onSelect,
  className,
  style,
}: SorenActionCardProps): ReactElement {
  const cardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    background: tokens.surface,
    color: tokens.onSurface,
    maxWidth: '22rem',
    ...style,
  };

  return (
    <div data-soren-action-card="" role="group" aria-label={title} className={className} style={cardStyle}>
      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            data-soren-option={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              textAlign: 'left',
              minHeight: sizes.tapMin,
              padding: '0.625rem 0.875rem',
              borderRadius: '0.5rem',
              border: `1px solid ${tokens.muted}`,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
