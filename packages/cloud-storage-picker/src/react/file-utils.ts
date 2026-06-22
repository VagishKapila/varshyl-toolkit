import type { CloudFile, CloudFileType, CloudProvider } from '../types.js';

export function iconNameForFileType(fileType: CloudFileType): string {
  return `file-${fileType}`;
}

export function newCloudFileId(): string {
  return `cf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function buildLinkedCloudFile(options: {
  url: string;
  name: string;
  provider: CloudProvider;
  fileType: CloudFileType;
  mimeType?: string;
}): CloudFile {
  return {
    id: newCloudFileId(),
    name: options.name,
    provider: options.provider,
    mimeType: options.mimeType ?? 'application/octet-stream',
    fileType: options.fileType,
    externalUrl: options.url,
    iconName: iconNameForFileType(options.fileType),
    source: 'linked',
  };
}

export function buildUploadedCloudFile(options: {
  name: string;
  mimeType: string;
  fileType: CloudFileType;
  sizeBytes: number;
  downloadUrl?: string;
}): CloudFile {
  return {
    id: newCloudFileId(),
    name: options.name,
    provider: 'device',
    mimeType: options.mimeType,
    fileType: options.fileType,
    sizeBytes: options.sizeBytes,
    downloadUrl: options.downloadUrl,
    iconName: iconNameForFileType(options.fileType),
    source: 'uploaded',
  };
}
