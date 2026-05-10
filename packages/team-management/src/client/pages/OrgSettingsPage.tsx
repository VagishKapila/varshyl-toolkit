import React, { useState, useEffect } from 'react';
import { getOrg, updateOrg, deleteOrg, initiateTransfer } from '../api.js';
import { DangerZoneCard } from '../components/DangerZoneCard.js';
import { useCurrentMembership } from '../hooks/useCurrentMembership.js';
import type { PublicOrg } from '../types.js';

interface OrgSettingsPageProps {
  orgId: number;
}

export function OrgSettingsPage({ orgId }: OrgSettingsPageProps) {
  const { membership } = useCurrentMembership();
  const [org, setOrg] = useState<PublicOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [transferUserId, setTransferUserId] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const isOwner = membership?.role === 'owner';
  const isAdmin = membership?.role === 'admin' || isOwner;

  useEffect(() => {
    setLoading(true);
    getOrg(orgId)
      .then((o) => {
        setOrg(o);
        setName(o.name);
        setSlug(o.slug);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateOrg(orgId, { name, slug });
      setOrg(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteOrg(orgId, org!.name);
    window.location.href = '/';
  }

  async function handleInitiateTransfer() {
    const uid = parseInt(transferUserId, 10);
    if (!uid) { setTransferError('Enter a valid user ID'); return; }
    setTransferError(null);
    try {
      await initiateTransfer(orgId, uid);
      setTransferSuccess(true);
      setTransferUserId('');
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : 'Failed to initiate transfer');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>

      {/* General Settings */}
      {isAdmin && (
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">General</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                required
                disabled={saving}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
              />
              <p className="mt-1 text-xs text-slate-500">
                Used in URLs. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {saveSuccess && <p className="text-sm text-green-600">Settings saved!</p>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </section>
      )}

      {/* Danger Zone — Owner only */}
      {isOwner && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Danger Zone</h2>

          {/* Ownership Transfer */}
          <div className="border border-amber-200 rounded-lg p-5 bg-amber-50">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">Transfer Ownership</h3>
            <p className="text-sm text-amber-700 mb-3">
              Transfer ownership of this organization to another member. The recipient must accept within 72 hours.
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Target user ID"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="flex-1 rounded-md border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleInitiateTransfer}
                className="rounded-md border border-amber-600 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                Initiate Transfer
              </button>
            </div>
            {transferError && <p className="mt-2 text-sm text-red-600">{transferError}</p>}
            {transferSuccess && <p className="mt-2 text-sm text-green-600">Transfer initiated! Awaiting recipient acceptance.</p>}
          </div>

          <DangerZoneCard
            title="Delete Organization"
            description="Permanently delete this organization and all its data. This action cannot be undone."
            buttonLabel="Delete Organization"
            onConfirm={handleDelete}
            confirmPrompt={org?.name}
          />
        </section>
      )}
    </div>
  );
}
