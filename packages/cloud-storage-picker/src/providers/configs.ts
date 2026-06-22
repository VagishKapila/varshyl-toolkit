import type { CloudProvider, ProviderConfig } from '../types.js';

export const PROVIDER_CONFIGS: Record<
  CloudProvider,
  Omit<ProviderConfig, 'available'>
> = {
  'google-drive': {
    id: 'google-drive',
    label: 'Google Drive',
    icon: '▲',
    color: '#4285F4',
    authRequired: true,
  },
  dropbox: {
    id: 'dropbox',
    label: 'Dropbox',
    icon: '📦',
    color: '#0061FF',
    authRequired: false,
  },
  box: {
    id: 'box',
    label: 'Box',
    icon: '□',
    color: '#0061D5',
    authRequired: true,
  },
  icloud: {
    id: 'icloud',
    label: 'iCloud Drive',
    icon: '☁️',
    color: '#3478F6',
    authRequired: false,
  },
  onedrive: {
    id: 'onedrive',
    label: 'OneDrive',
    icon: '🔷',
    color: '#0078D4',
    authRequired: true,
  },
  device: {
    id: 'device',
    label: 'Device Files',
    icon: '📁',
    color: '#7C9B8A',
    authRequired: false,
  },
  link: {
    id: 'link',
    label: 'Paste Link',
    icon: '🔗',
    color: '#2D3B36',
    authRequired: false,
  },
};

/** Display order for the provider grid (2 columns). */
export const PROVIDER_ORDER: CloudProvider[] = [
  'device',
  'link',
  'google-drive',
  'dropbox',
  'icloud',
  'box',
  'onedrive',
];
