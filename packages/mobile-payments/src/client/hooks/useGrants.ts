import { useCallback, useEffect, useState } from 'react';
import type { GrantRecord, PromoCode } from '../../types.js';
import { mapGrantRecord, mapPromoCode, readApiJson } from './grantsApiHelpers.js';

export interface UseGrantsOptions {
  productSlug: string;
  apiUrl: string;
}

export interface UseGrantsReturn {
  grants: GrantRecord[];
  promoCodes: PromoCode[];
  loading: boolean;
  error: string | null;
  grantAccess: (params: {
    userId: string;
    reason: string;
    permanent: boolean;
    days?: number;
    grantedBy: string;
  }) => Promise<void>;
  revokeAccess: (userId: string) => Promise<void>;
  createPromoCode: (params: {
    code: string;
    permanent: boolean;
    maxUses?: number;
    days?: number;
    createdBy: string;
  }) => Promise<void>;
  revokePromoCode: (codeId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGrants(options: UseGrantsOptions): UseGrantsReturn {
  const { productSlug, apiUrl } = options;
  const [grants, setGrants] = useState<GrantRecord[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `productSlug=${encodeURIComponent(productSlug)}`;
      const [grantsRes, codesRes] = await Promise.all([
        fetch(`${apiUrl}?${qs}`),
        fetch(`${apiUrl}/codes?${qs}`),
      ]);
      const grantsJson = await readApiJson(grantsRes);
      const codesJson = await readApiJson(codesRes);
      if (!grantsRes.ok || grantsJson.success === false) throw new Error(grantsJson.error ?? 'Failed to load grants');
      if (!codesRes.ok || codesJson.success === false) throw new Error(codesJson.error ?? 'Failed to load promo codes');
      setGrants((grantsJson.data as Record<string, unknown>[]).map(mapGrantRecord));
      setPromoCodes((codesJson.data as Record<string, unknown>[]).map(mapPromoCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, productSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const grantAccess = useCallback(async (params: {
    userId: string; reason: string; permanent: boolean; days?: number; grantedBy: string;
  }) => {
    const expiresAt = params.permanent || params.days == null
      ? null
      : new Date(Date.now() + params.days * 86400000).toISOString();
    setGrants((prev) => [{
      id: `temp-${Date.now()}`, userId: params.userId, productSlug, grantedBy: params.grantedBy,
      reason: params.reason, expiresAt: expiresAt ? new Date(expiresAt) : null, revokedAt: null, createdAt: new Date(),
    }, ...prev]);
    const res = await fetch(`${apiUrl}/grant`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: params.userId, productSlug, grantedBy: params.grantedBy, reason: params.reason, expiresAt }),
    });
    const json = await readApiJson(res);
    if (!res.ok || json.success === false) setError(json.error ?? 'Failed to grant access');
    await refresh();
  }, [apiUrl, productSlug, refresh]);

  const revokeAccessFn = useCallback(async (userId: string) => {
    setGrants((prev) => prev.filter((g) => g.userId !== userId));
    const res = await fetch(`${apiUrl}/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, productSlug }),
    });
    const json = await readApiJson(res);
    if (!res.ok || json.success === false) setError(json.error ?? 'Failed to revoke access');
    await refresh();
  }, [apiUrl, productSlug, refresh]);

  const createPromoCodeFn = useCallback(async (params: {
    code: string; permanent: boolean; maxUses?: number; days?: number; createdBy: string;
  }) => {
    setPromoCodes((prev) => [{
      id: `temp-${Date.now()}`, code: params.code.toUpperCase(), productSlug,
      maxUses: params.maxUses ?? null, uses: 0, expiresAt: null,
      grantsPermanent: params.permanent, grantsDays: params.permanent ? null : params.days ?? null,
      createdBy: params.createdBy, createdAt: new Date(), revokedAt: null,
    }, ...prev]);
    const res = await fetch(`${apiUrl}/codes/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        code: params.code, productSlug, createdBy: params.createdBy, maxUses: params.maxUses ?? null,
        grantsPermanent: params.permanent, grantsDays: params.permanent ? null : params.days ?? null,
      }),
    });
    const json = await readApiJson(res);
    if (!res.ok || json.success === false) setError(json.error ?? 'Failed to create promo code');
    await refresh();
  }, [apiUrl, productSlug, refresh]);

  const revokePromoCodeFn = useCallback(async (codeId: string) => {
    setPromoCodes((prev) => prev.filter((c) => c.id !== codeId));
    const res = await fetch(`${apiUrl}/codes/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: codeId, productSlug }),
    });
    const json = await readApiJson(res);
    if (!res.ok || json.success === false) setError(json.error ?? 'Failed to revoke promo code');
    await refresh();
  }, [apiUrl, productSlug, refresh]);

  return {
    grants, promoCodes, loading, error,
    grantAccess, revokeAccess: revokeAccessFn, createPromoCode: createPromoCodeFn,
    revokePromoCode: revokePromoCodeFn, refresh,
  };
}
