import type { SubscriptionState, Offering } from '../../types.js';
import type { SubscriptionService } from './subscription-service.js';

export interface MockSubscriptionOptions {
  orgId?: string;
  userId?: string;
  syncBaseUrl?: string;
}

function defaultState(orgId: string): SubscriptionState {
  return {
    orgId,
    status: 'none',
    seats: 0,
    isActive: false,
    isInTrial: false,
    expiresAt: null,
    accessMode: { canRead: true, canWrite: false },
  };
}

function entitledState(
  orgId: string,
  status: 'trial' | 'active',
  seats: number
): SubscriptionState {
  return {
    orgId,
    status,
    seats,
    isActive: true,
    isInTrial: status === 'trial',
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    accessMode: { canRead: true, canWrite: true },
  };
}

function lapsedState(orgId: string): SubscriptionState {
  return {
    orgId,
    status: 'lapsed',
    seats: 1,
    isActive: false,
    isInTrial: false,
    expiresAt: null,
    accessMode: { canRead: true, canWrite: false },
  };
}

async function syncToServer(
  baseUrl: string,
  payload: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/mock/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? `Sync failed (${res.status})`);
  }
}

const MOCK_OFFERINGS: Offering[] = [
  {
    identifier: 'default',
    packages: [
      {
        identifier: 'monthly',
        priceString: '$35.00',
        trialLabel: '90-day free trial',
      },
    ],
  },
];

export function createMockSubscriptionService(
  options: MockSubscriptionOptions = {}
): SubscriptionService & { forceLapsed(): SubscriptionState } {
  let orgId = options.orgId ?? 'demo-org';
  const userId = options.userId ?? 'user-1';
  let state = defaultState(orgId);
  const syncBaseUrl = options.syncBaseUrl;

  const service = {
    async configure(nextOrgId: string) {
      if (nextOrgId !== orgId) {
        orgId = nextOrgId;
        state = defaultState(orgId);
      }
    },

    async getState() {
      return state;
    },

    async getOfferings() {
      return MOCK_OFFERINGS;
    },

    async purchase(packageId: string) {
      void packageId;
      state = entitledState(orgId, 'trial', 1);
      if (syncBaseUrl) {
        await syncToServer(syncBaseUrl, {
          orgId,
          userId,
          status: 'trial',
          seats: 1,
          eventType: 'INITIAL_PURCHASE',
          amount: 35,
        });
      }
      return state;
    },

    async restore() {
      state = entitledState(orgId, 'active', 1);
      if (syncBaseUrl) {
        await syncToServer(syncBaseUrl, {
          orgId,
          userId,
          status: 'active',
          seats: 1,
          eventType: 'RESTORE',
          amount: 35,
        });
      }
      return state;
    },

    forceLapsed() {
      state = lapsedState(orgId);
      return state;
    },
  };

  return service;
}

export class MockSubscriptionService implements SubscriptionService {
  private inner: ReturnType<typeof createMockSubscriptionService>;

  constructor(options?: MockSubscriptionOptions) {
    this.inner = createMockSubscriptionService(options);
  }

  configure(orgId: string): Promise<void> {
    return this.inner.configure(orgId);
  }

  getState(): Promise<SubscriptionState> {
    return this.inner.getState();
  }

  getOfferings(): Promise<Offering[]> {
    return this.inner.getOfferings();
  }

  purchase(packageId: string): Promise<SubscriptionState> {
    return this.inner.purchase(packageId);
  }

  restore(): Promise<SubscriptionState> {
    return this.inner.restore();
  }

  forceLapsed(): SubscriptionState {
    return this.inner.forceLapsed();
  }
}
