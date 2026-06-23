import type { CSSProperties } from 'react';

export interface FileSizeWarningProps {
  fileName: string;
  sizeBytes: number;
  providerLabel: string;
  onContinue: () => void;
  onCancel: () => void;
}

function mb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function FileSizeWarning({
  fileName,
  sizeBytes,
  providerLabel,
  onContinue,
  onCancel,
}: FileSizeWarningProps) {
  return (
    <div>
      <p style={{ fontSize: 14, color: '#2D3B36', lineHeight: 1.5, marginBottom: 16 }}>
        ⚠️ This file is too large to upload ({mb(sizeBytes)} MB). It will be added as a link instead
        — tap to open from {providerLabel}.
      </p>
      <p style={{ fontSize: 12, color: '#7C9B8A', marginBottom: 16 }}>{fileName}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onContinue} style={primaryBtn}>
          Add as Link
        </button>
        <button type="button" onClick={onCancel} style={secondaryBtn}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const primaryBtn: CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#7C9B8A',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

const secondaryBtn: CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #E4DDD4',
  background: '#fff',
  color: '#2D3B36',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};
