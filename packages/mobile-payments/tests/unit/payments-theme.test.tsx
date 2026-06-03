import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  PaywallScreen,
  FeatureGate,
  ReadOnlyBanner,
  RestoreButton,
  PaymentsThemeProvider,
  configureSubscriptions,
  createMockSubscriptionService,
} from '../../src/client.js';

const mockService = createMockSubscriptionService();

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  configureSubscriptions({
    service: mockService,
    config: { orgId: 'org-1', userId: 'user-1' },
  });
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

describe('legacy path (no PaymentsThemeProvider)', () => {
  it('PaywallScreen renders with default theme', async () => {
    render(<PaywallScreen />);
    await waitFor(() => expect(screen.getByTestId('paywall-price')).toBeTruthy());
    const root = screen.getByTestId('paywall-screen') as HTMLDivElement;
    expect(root.style.getPropertyValue('--mp-surface')).toBe('#FAF7F0');
    expect(console.warn).toHaveBeenCalled();
  });

  it('ReadOnlyBanner renders', () => {
    render(<ReadOnlyBanner />);
    expect(screen.getByTestId('read-only-banner')).toBeTruthy();
  });

  it('RestoreButton renders', () => {
    render(<RestoreButton />);
    expect(screen.getByTestId('paywall-restore')).toBeTruthy();
  });

  it('FeatureGate renders blocked state', () => {
    render(
      <FeatureGate accessMode={{ canRead: true, canWrite: false }}>
        <button type="button">Write</button>
      </FeatureGate>,
    );
    expect(screen.getByTestId('feature-gate-message')).toBeTruthy();
  });
});

describe('PaymentsThemeProvider', () => {
  it('PaywallScreen CTA uses sage primary from theme', async () => {
    render(
      <PaymentsThemeProvider theme={JOBSITE_THEME}>
        <PaywallScreen />
      </PaymentsThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('paywall-subscribe')).toBeTruthy());
    const root = screen.getByTestId('paywall-screen') as HTMLDivElement;
    expect(root.style.getPropertyValue('--mp-primary')).toBe('#3A6B5F');
    const cta = screen.getByTestId('paywall-subscribe') as HTMLButtonElement;
    expect(cta.className).toContain('mp-paywall__cta');
  });

  it('does not warn when PaymentsThemeProvider is present', async () => {
    render(
      <PaymentsThemeProvider theme={JOBSITE_THEME}>
        <PaywallScreen />
      </PaymentsThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('paywall-title')).toBeTruthy());
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('*ClassName overrides', () => {
  it('PaywallScreen applies custom class names', async () => {
    render(
      <PaywallScreen
        paywallClassName="custom-paywall"
        planCardClassName="custom-plan"
        ctaButtonClassName="custom-cta"
        restoreButtonClassName="custom-restore"
        errorClassName="custom-error"
      />,
    );
    await waitFor(() => expect(screen.getByTestId('paywall-screen')).toBeTruthy());
    expect(screen.getByTestId('paywall-screen').className).toContain('custom-paywall');
    expect(screen.getByTestId('paywall-subscribe').className).toContain('custom-cta');
    expect(screen.getByTestId('paywall-restore').className).toContain('custom-restore');
  });

  it('ReadOnlyBanner applies bannerClassName', () => {
    render(<ReadOnlyBanner bannerClassName="custom-banner" />);
    expect(screen.getByTestId('read-only-banner').className).toContain('custom-banner');
  });

  it('FeatureGate applies gate and message class names', () => {
    render(
      <FeatureGate
        accessMode={{ canRead: true, canWrite: false }}
        gateClassName="custom-gate"
        blockedMessageClassName="custom-blocked-msg"
      >
        <span>child</span>
      </FeatureGate>,
    );
    expect(screen.getByTestId('feature-gate-blocked').className).toContain('custom-gate');
    expect(screen.getByTestId('feature-gate-message').className).toContain('custom-blocked-msg');
  });
});

describe('paywall snapshots', () => {
  it('default theme snapshot', async () => {
    const { container } = render(
      <PaymentsThemeProvider>
        <PaywallScreen />
      </PaymentsThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('paywall-price')).toBeTruthy());
    expect(container.firstChild).toMatchSnapshot();
  });

  it('JobSite Intel (sage) theme snapshot', async () => {
    const { container } = render(
      <PaymentsThemeProvider theme={JOBSITE_THEME}>
        <PaywallScreen />
      </PaymentsThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('paywall-price')).toBeTruthy());
    expect(container.firstChild).toMatchSnapshot();
  });

  it('BrandOS placeholder theme snapshot', async () => {
    const { container } = render(
      <PaymentsThemeProvider theme={BRANDOS_THEME}>
        <PaywallScreen />
      </PaymentsThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('paywall-price')).toBeTruthy());
    expect(container.firstChild).toMatchSnapshot();
  });
});
