import type { CloudFileType, CloudProvider } from '../types.js';
import { fileTypeFromExtension } from './platform.js';

export function detectProviderFromUrl(url: string): CloudProvider {
  try {
    const h = new URL(url).hostname;
    if (h.includes('drive.google.com') || h.includes('docs.google.com')) return 'google-drive';
    if (h.includes('dropbox.com')) return 'dropbox';
    if (h.includes('box.com')) return 'box';
    if (h.includes('icloud.com')) return 'icloud';
    if (h.includes('1drv.ms') || h.includes('sharepoint.com') || h.includes('onedrive.live.com')) {
      return 'onedrive';
    }
  } catch {
    /* invalid URL */
  }
  return 'link';
}

export function detectFileTypeFromUrl(url: string): CloudFileType {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return fileTypeFromExtension(ext);
}
