import type { CloudFileType, CloudProvider, ProviderConfig } from '../types.js';
import { PROVIDER_CONFIGS } from './configs.js';

export type Platform = 'ios' | 'android' | 'web';

export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  if (cap?.getPlatform?.() === 'ios') return 'ios';
  if (cap?.getPlatform?.() === 'android') return 'android';
  return 'web';
}

export function getAvailableProviders(platform?: Platform): ProviderConfig[] {
  const p = platform ?? detectPlatform();
  return (Object.values(PROVIDER_CONFIGS) as Omit<ProviderConfig, 'available'>[]).map((config) => ({
    ...config,
    available: isProviderAvailable(config.id, p),
  }));
}

function isProviderAvailable(provider: CloudProvider, platform: Platform): boolean {
  switch (provider) {
    case 'device':
      return true;
    case 'link':
      return true;
    case 'icloud':
      return platform === 'ios';
    case 'google-drive':
      return true;
    case 'dropbox':
      return true;
    case 'box':
      return platform === 'web';
    case 'onedrive':
      return platform === 'web';
    default:
      return false;
  }
}

export function fileTypeFromExtension(ext: string): CloudFileType {
  const map: Record<string, CloudFileType> = {
    pdf: 'pdf',
    xlsx: 'xlsx',
    xls: 'xlsx',
    docx: 'docx',
    doc: 'docx',
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpg',
    pptx: 'pptx',
    ppt: 'pptx',
  };
  return map[ext.toLowerCase()] ?? 'other';
}
