import type { CloudFileType } from '../types.js';
import { fileTypeFromExtension } from '../providers/platform.js';

export interface DevicePickResult {
  name: string;
  sizeBytes: number;
  mimeType: string;
  dataUrl?: string;
}

function isNativeCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

function fileTypeFromName(name: string, mimeType: string): CloudFileType {
  const ext = name.split('.').pop() ?? '';
  if (ext) return fileTypeFromExtension(ext);
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'xlsx';
  if (mimeType.includes('word')) return 'docx';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'pptx';
  return 'other';
}

export function pickDeviceFile(): Promise<DevicePickResult> {
  if (isNativeCapacitor()) {
    return pickNativeFile();
  }
  return pickWebFile();
}

async function pickNativeFile(): Promise<DevicePickResult> {
  const { FilePicker } = await import('@capawesome/capacitor-file-picker');
  const result = await FilePicker.pickFiles({ readData: false });
  const file = result.files?.[0];
  if (!file) throw new Error('No file selected');
  return {
    name: file.name ?? 'file',
    sizeBytes: file.size ?? 0,
    mimeType: file.mimeType ?? 'application/octet-stream',
  };
}

function pickWebFile(): Promise<DevicePickResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      resolve({
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
      });
    });
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      reject(new Error('File picker cancelled'));
    });
    document.body.appendChild(input);
    input.click();
  });
}

export { fileTypeFromName };
