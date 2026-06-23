import type { HealthCheckDef } from './health-types.js';

const PDF_SAMPLE = {
  userId: 'health-check',
  firstName: 'Alex',
  lastName: 'Rivera',
  title: 'Construction Superintendent',
  yearsActive: 10,
  projectCount: 12,
  logCount: 240,
  skills: ['Concrete', 'Safety'],
  summary: 'Seasoned superintendent with proven field leadership.',
};

export const HEALTH_CHECKS: HealthCheckDef[] = [
  {
    name: 'auth-social: VERSION export',
    run: async () => {
      const mod = await import('@varshylinc/auth-social');
      const v = (mod as { VERSION?: unknown }).VERSION;
      return typeof v === 'string'
        ? { status: 'pass', detail: `VERSION: ${v}` }
        : { status: 'fail', detail: 'VERSION is undefined' };
    },
  },
  {
    name: 'auth-social: configureSocialAuth loads',
    run: async () => {
      const mod = await import('@varshylinc/auth-social');
      const fn = (mod as { configureSocialAuth?: unknown }).configureSocialAuth;
      return typeof fn === 'function'
        ? { status: 'pass' }
        : { status: 'fail', detail: 'configureSocialAuth is not a function on main barrel' };
    },
  },
  {
    name: 'mobile-payments: VERSION export',
    run: async () => {
      const mod = await import('@varshylinc/mobile-payments');
      const v = (mod as { VERSION?: unknown }).VERSION;
      return typeof v === 'string'
        ? { status: 'pass', detail: `VERSION: ${v}` }
        : { status: 'fail', detail: 'VERSION is undefined' };
    },
  },
  {
    name: 'mobile-payments: hasGrantedAccess loads',
    run: async () => {
      const { hasGrantedAccess } = await import('@varshylinc/mobile-payments');
      return typeof hasGrantedAccess === 'function'
        ? { status: 'pass' }
        : { status: 'fail', detail: 'hasGrantedAccess missing' };
    },
  },
  {
    name: 'mobile-payments: grantsRouter loads',
    run: async () => {
      const { grantsRouter } = await import('@varshylinc/mobile-payments/express');
      return typeof grantsRouter === 'function'
        ? { status: 'pass' }
        : { status: 'fail', detail: 'grantsRouter is not a function' };
    },
  },
  {
    name: 'consent: VERSION or main export loads',
    run: async () => {
      const mod = await import('@varshylinc/onboarding-consent-engine');
      if (typeof (mod as { VERSION?: unknown }).VERSION === 'string') {
        const v = (mod as unknown as { VERSION: string }).VERSION;
        return { status: 'pass', detail: `VERSION: ${v}` };
      }
      if (typeof mod.runMigrations === 'function') {
        return { status: 'pass', detail: 'runMigrations loaded' };
      }
      return { status: 'fail', detail: 'No VERSION or runMigrations export' };
    },
  },
  {
    name: 'team-management: main export loads',
    run: async () => {
      const { createServerModule } = await import('@varshylinc/team-management');
      return typeof createServerModule === 'function'
        ? { status: 'pass' }
        : { status: 'fail', detail: 'createServerModule missing' };
    },
  },
  {
    name: 'build-verify: main export loads',
    run: async () => {
      const { runVerify } = await import('@varshylinc/capacitor-build-verify');
      return typeof runVerify === 'function'
        ? { status: 'pass' }
        : { status: 'fail', detail: 'runVerify missing' };
    },
  },
  {
    name: 'notifications: registerDeviceToken loads',
    run: async () => {
      const { registerDeviceToken } = await import('@varshylinc/notifications/server');
      return typeof registerDeviceToken === 'function'
        ? { status: 'pass' }
        : { status: 'fail', detail: 'registerDeviceToken missing' };
    },
  },
  {
    name: 'notifications: sendPushToSegment loads',
    run: async () => {
      const { sendPushToSegment } = await import('@varshylinc/notifications/server');
      return typeof sendPushToSegment === 'function'
        ? { status: 'pass' }
        : { status: 'fail', detail: 'sendPushToSegment missing' };
    },
  },
  {
    name: 'soren-screen: VERSION is 0.2.1',
    run: async () => {
      const { VERSION } = await import('@varshylinc/soren-screen');
      return VERSION === '0.2.1'
        ? { status: 'pass', detail: `VERSION: ${VERSION}` }
        : { status: 'fail', detail: `VERSION: ${String(VERSION)}` };
    },
  },
  {
    name: 'soren-screen: Q&A engine — 3 match tests',
    run: async () => {
      const { createQAEngine } = await import('@varshylinc/soren-screen/server');
      const { JOBSITE_QA, jobsiteConfig } = await import('@varshylinc/soren-screen/adapters/jobsite');
      const engine = createQAEngine({
        productId: jobsiteConfig.productId,
        qaRegistry: { [jobsiteConfig.productId]: JOBSITE_QA },
      });
      const daily = await engine.search('how do I create a daily log');
      const superBowl = await engine.search('who won the Super Bowl');
      const spanish = await engine.search('can I use this in Spanish');
      const ok =
        !daily.outOfScope &&
        superBowl.outOfScope &&
        !spanish.outOfScope;
      return ok
        ? { status: 'pass', detail: 'daily log=match, Super Bowl=OOS, Spanish=match' }
        : {
            status: 'fail',
            detail: `daily=${daily.outOfScope ? 'OOS' : 'match'}, superBowl=${superBowl.outOfScope ? 'OOS' : 'match'}, spanish=${spanish.outOfScope ? 'OOS' : 'match'}`,
          };
    },
  },
  {
    name: 'soren-screen: PDF generation',
    run: async () => {
      const { buildPortfolioPdf } = await import('@varshylinc/soren-screen/server');
      const result = await buildPortfolioPdf(PDF_SAMPLE, {});
      const buf = result.pdfBuffer;
      const len = buf?.length ?? 0;
      const header = buf ? Buffer.from(buf.slice(0, 5)).toString('ascii') : '';
      const ok = len > 1500 && header === '%PDF-';
      return ok
        ? { status: 'pass', detail: `${len} bytes, header ${header}` }
        : { status: 'fail', detail: `${len} bytes, header ${header || '(empty)'}` };
    },
  },
  {
    name: 'cloud-storage-picker: VERSION is 0.1.0',
    run: async () => {
      const { VERSION } = await import('@varshylinc/cloud-storage-picker');
      return VERSION === '0.1.0'
        ? { status: 'pass', detail: `VERSION: ${VERSION}` }
        : { status: 'fail', detail: `VERSION: ${String(VERSION)}` };
    },
  },
  {
    name: 'cloud-storage-picker: getAvailableProviders',
    run: async () => {
      const { getAvailableProviders } = await import('@varshylinc/cloud-storage-picker/providers');
      const providers = getAvailableProviders('web');
      const ids = providers.map((p) => p.id);
      const ok = ids.includes('device') && ids.includes('link');
      return ok
        ? { status: 'pass', detail: `providers: ${ids.join(', ')}` }
        : { status: 'fail', detail: `missing device/link in: ${ids.join(', ')}` };
    },
  },
  {
    name: 'cloud-storage-picker: URL detection',
    run: async () => {
      const { detectProviderFromUrl } = await import('@varshylinc/cloud-storage-picker/providers');
      const g = detectProviderFromUrl('https://drive.google.com/file/d/abc/view');
      const d = detectProviderFromUrl('https://www.dropbox.com/s/abc/file.pdf');
      const u = detectProviderFromUrl('https://example.com/unknown.pdf');
      const ok = g === 'google-drive' && d === 'dropbox' && u === 'link';
      return ok
        ? { status: 'pass', detail: `google=${g}, dropbox=${d}, unknown=${u}` }
        : { status: 'fail', detail: `google=${g}, dropbox=${d}, unknown=${u}` };
    },
  },
  {
    name: 'ui-inputs: VERSION export',
    run: async () => {
      try {
        const uiInputs = await import('@varshylinc/ui-inputs');
        const ok = typeof uiInputs.VERSION === 'string';
        return ok
          ? { status: 'pass', detail: `VERSION: ${uiInputs.VERSION}` }
          : { status: 'fail', detail: 'VERSION not found on main barrel' };
      } catch (e) {
        return { status: 'fail', detail: e instanceof Error ? e.message : String(e) };
      }
    },
  },
  {
    name: 'ui-inputs: VarshylTextInput loads',
    run: async () => {
      try {
        const r = await import('@varshylinc/ui-inputs/react');
        const ok = typeof r.VarshylTextInput === 'function';
        return ok
          ? { status: 'pass', detail: 'VarshylTextInput: function' }
          : { status: 'fail', detail: 'VarshylTextInput is not a function' };
      } catch (e) {
        return { status: 'fail', detail: e instanceof Error ? e.message : String(e) };
      }
    },
  },
  {
    name: 'ui-inputs: all 5 components present',
    run: async () => {
      try {
        const r = await import('@varshylinc/ui-inputs/react');
        const components = [
          'VarshylTextInput',
          'VarshylEmailInput',
          'VarshylAddressInput',
          'VarshylSearchInput',
          'VarshylPasswordInput',
        ] as const;
        const results = components.map((k) => ({ name: k, ok: typeof r[k] === 'function' }));
        const allPass = results.every((x) => x.ok);
        const detail = results.map((x) => `${x.ok ? '✅' : '❌'} ${x.name}`).join(', ');
        return allPass ? { status: 'pass', detail } : { status: 'fail', detail };
      } catch (e) {
        return { status: 'fail', detail: e instanceof Error ? e.message : String(e) };
      }
    },
  },
  {
    name: 'auth-social: Apple Sign In (manual — needs device)',
    run: async () => ({
      status: 'skip',
      detail: 'Requires physical device and Apple developer credentials',
    }),
  },
  {
    name: 'auth-social: Google Sign In (manual — needs device)',
    run: async () => ({
      status: 'skip',
      detail: 'Requires physical device and Google OAuth client',
    }),
  },
  {
    name: 'notifications: FCM push send (manual — needs Firebase creds)',
    run: async () => ({
      status: 'skip',
      detail: 'Requires FIREBASE_* credentials and registered device token',
    }),
  },
  {
    name: 'mobile-payments: RevenueCat paywall (manual — needs device)',
    run: async () => ({
      status: 'skip',
      detail: 'Requires Capacitor device and RevenueCat API key',
    }),
  },
];
