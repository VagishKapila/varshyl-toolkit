import type { CSSProperties } from 'react';
import type { CloudFile, CloudFileType } from '../../types.js';
import { PROVIDER_CONFIGS } from '../../providers/configs.js';
import { useLinkPaste } from '../hooks/useLinkPaste.js';

export interface LinkInputProps {
  onFilePicked: (file: CloudFile) => void;
  onBack: () => void;
}

const TYPE_CHIPS: { label: string; type: CloudFileType }[] = [
  { label: 'PDF', type: 'pdf' },
  { label: 'Excel', type: 'xlsx' },
  { label: 'Word', type: 'docx' },
  { label: 'Image', type: 'png' },
  { label: 'Other', type: 'other' },
];

export function LinkInput({ onFilePicked, onBack }: LinkInputProps) {
  const link = useLinkPaste();
  const effectiveType = link.manualFileType ?? link.detectedFileType;
  const showTypeChips = effectiveType === 'other' || effectiveType === null;

  const handleAdd = () => {
    const file = link.buildCloudFile();
    if (file) onFilePicked(file);
  };

  return (
    <div>
      <button type="button" onClick={onBack} style={backBtn}>
        ← Back
      </button>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 12px', color: '#2D3B36' }}>
        Paste your file link
      </h3>
      <input
        type="url"
        placeholder="https://..."
        value={link.url}
        onChange={(e) => link.setUrl(e.target.value)}
        style={inputStyle}
      />
      {link.detectedProvider && (
        <div style={badgeStyle}>
          {PROVIDER_CONFIGS[link.detectedProvider].icon}{' '}
          {PROVIDER_CONFIGS[link.detectedProvider].label}
        </div>
      )}
      {effectiveType && effectiveType !== 'other' && (
        <div style={chipStyle}>{effectiveType.toUpperCase()}</div>
      )}
      <input
        type="text"
        placeholder="Name this file (optional)"
        value={link.fileName}
        onChange={(e) => link.setFileName(e.target.value)}
        style={{ ...inputStyle, marginTop: 10 }}
      />
      {showTypeChips && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {TYPE_CHIPS.map((chip) => (
            <button
              key={chip.type}
              type="button"
              onClick={() => link.setManualFileType(chip.type)}
              style={{
                ...chipStyle,
                background: link.manualFileType === chip.type ? '#7C9B8A' : '#E8F0EC',
                color: link.manualFileType === chip.type ? '#fff' : '#2D3B36',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={!link.url.trim()}
        onClick={handleAdd}
        style={{
          ...primaryBtn,
          opacity: link.url.trim() ? 1 : 0.5,
          marginTop: 16,
        }}
      >
        Add Link
      </button>
    </div>
  );
}

const backBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#7C9B8A',
  cursor: 'pointer',
  fontSize: 13,
  padding: 0,
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #E4DDD4',
  fontSize: 14,
  background: '#fff',
  boxSizing: 'border-box',
};

const badgeStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  padding: '4px 10px',
  borderRadius: 8,
  background: '#E8F0EC',
  color: '#2D3B36',
  fontSize: 12,
  fontWeight: 600,
};

const chipStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  padding: '4px 10px',
  borderRadius: 8,
  background: '#E8F0EC',
  fontSize: 11,
  fontWeight: 600,
};

const primaryBtn: CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#7C9B8A',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};
