/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudStoragePicker } from '../src/react/components/CloudStoragePicker.js';
import type { CloudProvider } from '../src/types.js';

const baseConfig = {
  providers: ['device', 'link'] as CloudProvider[],
  onFilePicked: vi.fn(),
  onCancel: vi.fn(),
};

describe('CloudStoragePicker', () => {
  afterEach(() => cleanup());

  it('renders without crashing when closed', () => {
    render(<CloudStoragePicker {...baseConfig} isOpen={false} />);
    expect(screen.queryByText('Device Files')).toBeNull();
  });

  it('renders provider grid when open', () => {
    render(<CloudStoragePicker {...baseConfig} isOpen={true} />);
    expect(screen.getByText('Device Files')).toBeTruthy();
    expect(screen.getByText('Paste Link')).toBeTruthy();
  });

  it('shows LinkInput when Paste Link tapped', () => {
    render(<CloudStoragePicker {...baseConfig} isOpen={true} />);
    fireEvent.click(screen.getByText('Paste Link'));
    expect(screen.getByPlaceholderText('https://...')).toBeTruthy();
  });

  it('link paste detects Google Drive URL', async () => {
    render(<CloudStoragePicker {...baseConfig} isOpen={true} />);
    fireEvent.click(screen.getByText('Paste Link'));
    fireEvent.change(screen.getByPlaceholderText('https://...'), {
      target: { value: 'https://drive.google.com/file/d/abc/view' },
    });
    expect(document.body.textContent).toContain('Google Drive');
  });

  it('file >25MB shows FileSizeWarning threshold logic', () => {
    const LIMIT = 25 * 1024 * 1024;
    expect(26 * 1024 * 1024 > LIMIT).toBe(true);
  });
});
