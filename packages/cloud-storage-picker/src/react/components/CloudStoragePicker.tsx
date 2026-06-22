import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_MAX_UPLOAD_BYTES } from '../../index.js';
import { PROVIDER_CONFIGS } from '../../providers/configs.js';
import { getAvailableProviders } from '../../providers/platform.js';
import type { CloudFile, CloudPickerConfig, CloudProvider } from '../../types.js';
import { fileTypeFromName, pickDeviceFile } from '../device-picker.js';
import { buildLinkedCloudFile, buildUploadedCloudFile } from '../file-utils.js';
import { handleStyle, overlayStyle, sheetStyle, toastStyle } from '../picker-styles.js';
import { FileSizeWarning } from './FileSizeWarning.js';
import { LinkInput } from './LinkInput.js';
import { ProviderGrid } from './ProviderGrid.js';

type PickerView = 'grid' | 'link' | 'warning';

export type CloudStoragePickerProps = CloudPickerConfig & { isOpen: boolean };

interface PendingUpload {
  name: string;
  sizeBytes: number;
  mimeType: string;
  fileType: ReturnType<typeof fileTypeFromName>;
}

export function CloudStoragePicker({
  isOpen,
  providers,
  maxUploadBytes = DEFAULT_MAX_UPLOAD_BYTES,
  title = 'Add a file',
  subtitle = 'Choose where to pick your file from',
  onFilePicked,
  onError,
  onCancel,
}: CloudStoragePickerProps) {
  const [view, setView] = useState<PickerView>('grid');
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload | null>(null);

  const providerList = useMemo(() => {
    const allowed = new Set(providers);
    return getAvailableProviders().filter((p) => allowed.has(p.id));
  }, [providers]);

  const reset = useCallback(() => {
    setView('grid');
    setPending(null);
    setToast(null);
  }, []);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const finishPick = async (file: CloudFile) => {
    try {
      await onFilePicked(file);
      reset();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDevicePick = async () => {
    try {
      const picked = await pickDeviceFile();
      const fileType = fileTypeFromName(picked.name, picked.mimeType);
      if (picked.sizeBytes > maxUploadBytes) {
        setPending({
          name: picked.name,
          sizeBytes: picked.sizeBytes,
          mimeType: picked.mimeType,
          fileType,
        });
        setView('warning');
        return;
      }
      await finishPick(
        buildUploadedCloudFile({
          name: picked.name,
          mimeType: picked.mimeType,
          fileType,
          sizeBytes: picked.sizeBytes,
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('cancel')) onCancel?.();
      else onError?.(err instanceof Error ? err : new Error(message));
    }
  };

  const handleProviderSelect = (id: CloudProvider) => {
    if (id === 'link') {
      setView('link');
      return;
    }
    if (id === 'device') {
      void handleDevicePick();
      return;
    }
    const label = PROVIDER_CONFIGS[id].label;
    setToast(`Connect ${label} — coming in v0.2`);
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleWarningContinue = () => {
    if (!pending) return;
    void finishPick(
      buildLinkedCloudFile({
        url: '',
        name: pending.name,
        provider: 'device',
        fileType: pending.fileType,
      }),
    );
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={() => onCancel?.()} role="presentation">
      <div
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={handleStyle} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2D3B36', margin: '0 0 4px' }}>{title}</h2>
        <p style={{ fontSize: 13, color: '#7C9B8A', margin: '0 0 16px' }}>{subtitle}</p>
        {toast && <div style={toastStyle}>{toast}</div>}
        {view === 'grid' && (
          <ProviderGrid providers={providerList} onSelect={handleProviderSelect} />
        )}
        {view === 'link' && (
          <LinkInput onBack={() => setView('grid')} onFilePicked={(f) => void finishPick(f)} />
        )}
        {view === 'warning' && pending && (
          <FileSizeWarning
            fileName={pending.name}
            sizeBytes={pending.sizeBytes}
            providerLabel="Device Files"
            onContinue={handleWarningContinue}
            onCancel={() => {
              setPending(null);
              setView('grid');
            }}
          />
        )}
      </div>
    </div>
  );
}
