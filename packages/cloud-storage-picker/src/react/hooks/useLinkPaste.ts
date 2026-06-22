import { useMemo, useState } from 'react';
import { detectFileTypeFromUrl, detectProviderFromUrl } from '../../providers/link-detector.js';
import type { CloudFile, CloudFileType, CloudProvider } from '../../types.js';
import { buildLinkedCloudFile } from '../file-utils.js';

export interface UseLinkPasteReturn {
  url: string;
  setUrl: (url: string) => void;
  fileName: string;
  setFileName: (name: string) => void;
  detectedProvider: CloudProvider | null;
  detectedFileType: CloudFileType | null;
  manualFileType: CloudFileType | null;
  setManualFileType: (type: CloudFileType | null) => void;
  buildCloudFile: () => CloudFile | null;
  reset: () => void;
}

function nameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segment = path.split('/').filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : 'Linked file';
  } catch {
    return 'Linked file';
  }
}

export function useLinkPaste(): UseLinkPasteReturn {
  const [url, setUrlState] = useState('');
  const [fileName, setFileName] = useState('');
  const [manualFileType, setManualFileType] = useState<CloudFileType | null>(null);

  const detectedProvider = useMemo(() => {
    if (!url.trim()) return null;
    const p = detectProviderFromUrl(url);
    return p === 'link' ? null : p;
  }, [url]);

  const detectedFileType = useMemo(() => {
    if (!url.trim()) return null;
    return detectFileTypeFromUrl(url);
  }, [url]);

  const setUrl = (value: string) => {
    setUrlState(value);
    if (!fileName.trim()) setFileName(nameFromUrl(value));
  };

  const buildCloudFile = (): CloudFile | null => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    try {
      // eslint-disable-next-line no-new
      new URL(trimmed);
    } catch {
      return null;
    }
    const provider = detectProviderFromUrl(trimmed);
    const fileType = manualFileType ?? detectFileTypeFromUrl(trimmed);
    const name = fileName.trim() || nameFromUrl(trimmed);
    return buildLinkedCloudFile({
      url: trimmed,
      name,
      provider: provider === 'link' ? 'link' : provider,
      fileType,
    });
  };

  const reset = () => {
    setUrlState('');
    setFileName('');
    setManualFileType(null);
  };

  return {
    url,
    setUrl,
    fileName,
    setFileName,
    detectedProvider,
    detectedFileType,
    manualFileType,
    setManualFileType,
    buildCloudFile,
    reset,
  };
}
