import { ZipArchive } from 'archiver';
import { PassThrough } from 'node:stream';

export interface ZipEntry {
  filename: string;
  content: string;
}

export async function buildZipBuffer(entries: ZipEntry[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const passthrough = new PassThrough();
    passthrough.on('data', (chunk: Buffer) => chunks.push(chunk));
    passthrough.on('end', () => resolve(Buffer.concat(chunks)));
    passthrough.on('error', reject);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on('error', reject);
    archive.pipe(passthrough);

    for (const entry of entries) {
      archive.append(entry.content, { name: entry.filename });
    }

    void archive.finalize();
  });
}
