import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  InviteForm,
  RoleBadge,
  TeamManagementThemeProvider,
  setTeamTheme,
} from '../../src/client/index.js';

vi.mock('../../src/client/api.js', () => ({
  createInvitation: vi.fn().mockResolvedValue({ id: 1 }),
}));

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const JOBSITE_THEME = {
  primary: '#3A6B5F',
  primaryHover: '#2D544A',
  surface: '#FAF7F0',
  border: '#e8e0d0',
  text: '#211D18',
  textMuted: '#8a7f6f',
  error: '#8B3A2F',
  success: '#2D6A4F',
  radius: '12px',
};

const BRANDOS_THEME = {
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  surface: '#0f172a',
  border: '#334155',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  error: '#f87171',
  success: '#34d399',
  radius: '10px',
};

describe('legacy path (no TeamManagementThemeProvider)', () => {
  it('InviteForm renders with default CSS variables', () => {
    render(<InviteForm orgId={1} onSuccess={() => {}} />);
    const form = screen.getByTestId('invite-form') as HTMLFormElement;
    expect(form.style.getPropertyValue('--tm-surface')).toBe('#FAF7F0');
    expect(console.warn).toHaveBeenCalled();
  });

  it('setTeamTheme legacy path applies without provider', () => {
    setTeamTheme({ brick: '#3A6B5F', paper: '#FAF7F0', brass: '#e8e0d0', ink: '#211D18' });
    render(<InviteForm orgId={1} onSuccess={() => {}} />);
    const form = screen.getByTestId('invite-form') as HTMLFormElement;
    expect(form.style.getPropertyValue('--tm-primary')).toBe('#3A6B5F');
  });

  it('RoleBadge renders', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByTestId('role-badge').textContent).toBe('Admin');
  });
});

describe('TeamManagementThemeProvider', () => {
  it('InviteForm submit uses sage primary from theme', () => {
    render(
      <TeamManagementThemeProvider theme={JOBSITE_THEME}>
        <InviteForm orgId={1} onSuccess={() => {}} />
      </TeamManagementThemeProvider>,
    );
    const form = screen.getByTestId('invite-form') as HTMLFormElement;
    expect(form.style.getPropertyValue('--tm-primary')).toBe('#3A6B5F');
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('*ClassName overrides', () => {
  it('InviteForm applies custom class names', () => {
    render(
      <InviteForm
        orgId={1}
        onSuccess={() => {}}
        inviteFormClassName="custom-invite"
        submitButtonClassName="custom-submit"
      />,
    );
    expect(screen.getByTestId('invite-form').className).toContain('custom-invite');
    expect(screen.getByTestId('invite-submit').className).toContain('custom-submit');
  });
});

describe('invite form snapshots', () => {
  it('default theme snapshot', async () => {
    const { container } = render(
      <TeamManagementThemeProvider>
        <InviteForm orgId={1} onSuccess={() => {}} />
      </TeamManagementThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('invite-form')).toBeTruthy());
    expect(container.firstChild).toMatchSnapshot();
  });

  it('JobSite Intel (sage) theme snapshot', async () => {
    const { container } = render(
      <TeamManagementThemeProvider theme={JOBSITE_THEME}>
        <InviteForm orgId={1} onSuccess={() => {}} />
      </TeamManagementThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('invite-form')).toBeTruthy());
    expect(container.firstChild).toMatchSnapshot();
  });

  it('BrandOS placeholder theme snapshot', async () => {
    const { container } = render(
      <TeamManagementThemeProvider theme={BRANDOS_THEME}>
        <InviteForm orgId={1} onSuccess={() => {}} />
      </TeamManagementThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('invite-form')).toBeTruthy());
    expect(container.firstChild).toMatchSnapshot();
  });
});
