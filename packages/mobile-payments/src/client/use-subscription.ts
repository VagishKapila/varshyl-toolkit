import { useCallback, useEffect, useState } from 'react';
import type { SubscriptionState } from '../types.js';
import { subscriptionActions } from './actions.js';
import { getClientConfig, getSubscriptionService } from './configure.js';

const EMPTY: SubscriptionState = {
  orgId: '',
  status: 'none',
  seats: 0,
  isActive: false,
  isInTrial: false,
  expiresAt: null,
  accessMode: { canRead: true, canWrite: false },
};

export function useSubscription(): {
  isActive: boolean;
  isInTrial: boolean;
  status: SubscriptionState['status'];
  expiresAt: string | null;
  accessMode: SubscriptionState['accessMode'];
  seats: number;
  loading: boolean;
  actions: typeof subscriptionActions;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<SubscriptionState>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await getSubscriptionService().getState();
    setState(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { orgId } = getClientConfig();
    if (orgId) {
      void getSubscriptionService().configure(orgId).then(() => refresh());
    } else {
      void refresh();
    }
  }, [refresh]);

  const wrap = <T extends (...args: never[]) => Promise<{ ok: boolean; state?: SubscriptionState }>>(
    fn: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      const result = await fn(...args);
      if (result.ok && result.state) setState(result.state);
      else await refresh();
      return result;
    }) as T;
  };

  const actions = {
    openPaywall: subscriptionActions.openPaywall,
    purchase: wrap(subscriptionActions.purchase),
    restorePurchases: wrap(subscriptionActions.restorePurchases),
    refreshState: wrap(subscriptionActions.refreshState),
  };

  return {
    isActive: state.isActive,
    isInTrial: state.isInTrial,
    status: state.status,
    expiresAt: state.expiresAt,
    accessMode: state.accessMode,
    seats: state.seats,
    loading,
    actions,
    refresh,
  };
}
