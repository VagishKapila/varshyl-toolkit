/** Package version — useful for debugging and compatibility checks */
export const VERSION = '0.1.0' as const;

/** Default max upload size before auto-converting to linked source (25 MB). */
export const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export type {
  CloudProvider,
  CloudFileType,
  CloudFile,
  CloudPickerConfig,
  ProviderConfig,
} from './types.js';
