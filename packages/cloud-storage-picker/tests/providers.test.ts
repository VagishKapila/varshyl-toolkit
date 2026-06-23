import { describe, expect, it } from 'vitest';
import {
  detectFileTypeFromUrl,
  detectProviderFromUrl,
  getAvailableProviders,
} from '../src/providers.js';

describe('getAvailableProviders', () => {
  it('device + link always available on web', () => {
    const providers = getAvailableProviders('web');
    const ids = providers.map((p) => p.id);
    expect(ids).toContain('device');
    expect(ids).toContain('link');
  });

  it('icloud only available on ios', () => {
    const ios = getAvailableProviders('ios');
    const web = getAvailableProviders('web');
    const icloudIos = ios.find((p) => p.id === 'icloud');
    const icloudWeb = web.find((p) => p.id === 'icloud');
    expect(icloudIos?.available).toBe(true);
    expect(icloudWeb?.available).toBe(false);
  });

  it('all provider configs have required fields', () => {
    const providers = getAvailableProviders('web');
    for (const p of providers) {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.icon).toBeTruthy();
      expect(p.color).toMatch(/^#/);
    }
  });
});

describe('detectProviderFromUrl', () => {
  it('Google Drive', () => {
    expect(detectProviderFromUrl('https://drive.google.com/file/d/abc/view')).toBe('google-drive');
  });

  it('Dropbox', () => {
    expect(detectProviderFromUrl('https://www.dropbox.com/s/abc/file.pdf')).toBe('dropbox');
  });

  it('OneDrive', () => {
    expect(detectProviderFromUrl('https://1drv.ms/u/s!AhY')).toBe('onedrive');
  });

  it('unknown → link', () => {
    expect(detectProviderFromUrl('https://example.com/file.pdf')).toBe('link');
  });
});

describe('detectFileTypeFromUrl', () => {
  it('PDF', () => {
    expect(detectFileTypeFromUrl('https://example.com/report.pdf')).toBe('pdf');
  });

  it('Excel', () => {
    expect(detectFileTypeFromUrl('https://example.com/data.xlsx')).toBe('xlsx');
  });

  it('unknown → other', () => {
    expect(detectFileTypeFromUrl('https://example.com/something.zip')).toBe('other');
  });
});
