export type CloudProvider =
  | 'google-drive'
  | 'dropbox'
  | 'box'
  | 'icloud'
  | 'onedrive'
  | 'device'
  | 'link';

export type CloudFileType =
  | 'pdf'
  | 'xlsx'
  | 'docx'
  | 'png'
  | 'jpg'
  | 'pptx'
  | 'other';

export interface CloudFile {
  id: string;
  name: string;
  provider: CloudProvider;
  mimeType: string;
  fileType: CloudFileType;
  sizeBytes?: number;
  pageCount?: number;
  downloadUrl?: string;
  shareUrl?: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  iconName: string;
  source: 'uploaded' | 'linked';
}

export interface CloudPickerConfig {
  providers: CloudProvider[];
  allowedTypes?: CloudFileType[];
  maxUploadBytes?: number;
  title?: string;
  subtitle?: string;
  onFilePicked: (file: CloudFile) => void | Promise<void>;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

export interface ProviderConfig {
  id: CloudProvider;
  label: string;
  icon: string;
  color: string;
  available: boolean;
  authRequired: boolean;
}
