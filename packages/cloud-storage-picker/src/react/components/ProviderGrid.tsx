import type { ProviderConfig } from '../../types.js';
import { PROVIDER_ORDER } from '../../providers/configs.js';

export interface ProviderGridProps {
  providers: ProviderConfig[];
  onSelect: (id: ProviderConfig['id']) => void;
}

const ORDER_INDEX = new Map(PROVIDER_ORDER.map((id, i) => [id, i]));

export function ProviderGrid({ providers, onSelect }: ProviderGridProps) {
  const sorted = [...providers].sort(
    (a, b) => (ORDER_INDEX.get(a.id) ?? 99) - (ORDER_INDEX.get(b.id) ?? 99),
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
      }}
    >
      {sorted.map((provider) => (
        <button
          key={provider.id}
          type="button"
          disabled={!provider.available}
          onClick={() => provider.available && onSelect(provider.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '14px 8px',
            border: '1px solid #E4DDD4',
            borderRadius: 12,
            background: '#FBF8F1',
            cursor: provider.available ? 'pointer' : 'not-allowed',
            opacity: provider.available ? 1 : 0.35,
            minHeight: 88,
          }}
          onMouseEnter={(e) => {
            if (provider.available) e.currentTarget.style.background = '#F5F1E8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FBF8F1';
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>{provider.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2D3B36', textAlign: 'center' }}>
            {provider.label}
          </span>
          {!provider.available && (
            <span style={{ fontSize: 9, color: '#7C9B8A' }}>Not available</span>
          )}
        </button>
      ))}
    </div>
  );
}
