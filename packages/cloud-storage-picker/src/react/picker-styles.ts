import type { CSSProperties } from 'react';

export const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
};

export const sheetStyle: CSSProperties = {
  width: '100%',
  maxWidth: 480,
  maxHeight: '80vh',
  overflowY: 'auto',
  background: '#FBF8F1',
  borderRadius: '24px 24px 0 0',
  padding: '12px 24px 32px',
  transform: 'translateY(0)',
  transition: 'transform 0.25s ease, opacity 0.25s ease',
};

export const handleStyle: CSSProperties = {
  width: 40,
  height: 4,
  background: '#E4DDD4',
  borderRadius: 2,
  margin: '0 auto 16px',
};

export const toastStyle: CSSProperties = {
  marginBottom: 12,
  padding: '8px 12px',
  borderRadius: 8,
  background: '#E8F0EC',
  color: '#2D3B36',
  fontSize: 13,
};
