# @varshylinc/cloud-storage-picker

Unified cloud file picker for Varshyl products — pick files from Google Drive, Dropbox, Box, iCloud, OneDrive, device storage, or paste a link.

## Install

```bash
npm install @varshylinc/cloud-storage-picker
```

Peer dependencies (optional): `react`, `@capawesome/capacitor-file-picker` (native device picker).

## Quick start

```tsx
import { CloudStoragePicker, useCloudPicker } from '@varshylinc/cloud-storage-picker/react';
import type { CloudFile } from '@varshylinc/cloud-storage-picker';

function MyScreen() {
  const picker = useCloudPicker();

  return (
    <>
      <button type="button" onClick={picker.open}>Add file</button>
      <CloudStoragePicker
        isOpen={picker.isOpen}
        providers={['device', 'link', 'google-drive', 'dropbox']}
        onFilePicked={(file: CloudFile) => {
          console.log('Picked', file);
          picker.close();
        }}
        onCancel={picker.close}
      />
    </>
  );
}
```

## CloudFile type

| Field | Description |
|-------|-------------|
| `id` | Unique picker-generated id |
| `name` | Display name |
| `provider` | `google-drive`, `dropbox`, `box`, `icloud`, `onedrive`, `device`, `link` |
| `fileType` | `pdf`, `xlsx`, `docx`, `png`, `jpg`, `pptx`, `other` |
| `source` | `uploaded` (device) or `linked` (URL) |
| `externalUrl` | Set for linked files |
| `sizeBytes` | Set for uploads |

## JobSite Intel example

```tsx
import { CloudStoragePicker, useCloudPicker } from '@varshylinc/cloud-storage-picker/react';

<CloudStoragePicker
  isOpen={picker.isOpen}
  title="Attach to daily log"
  subtitle="Pick a spec sheet, photo, or paste a Drive link"
  providers={['device', 'link', 'google-drive', 'dropbox', 'icloud']}
  maxUploadBytes={25 * 1024 * 1024}
  onFilePicked={async (file) => attachToLog(file)}
  onCancel={picker.close}
/>
```

## Provider availability

| Provider | iOS | Android | Web |
|----------|-----|---------|-----|
| Device Files | ✅ | ✅ | ✅ |
| Paste Link | ✅ | ✅ | ✅ |
| Google Drive | ✅ | ✅ | ✅ |
| Dropbox | ✅ | ✅ | ✅ |
| iCloud Drive | ✅ | — | — |
| Box | — | — | ✅ |
| OneDrive | — | — | ✅ |

Use `getAvailableProviders()` from `@varshylinc/cloud-storage-picker/providers` for runtime checks.

## v0.2 roadmap

- OAuth connect flows for Google Drive, Dropbox, OneDrive
- Box enterprise picker
- Thumbnail previews for linked files

## License

Apache-2.0
