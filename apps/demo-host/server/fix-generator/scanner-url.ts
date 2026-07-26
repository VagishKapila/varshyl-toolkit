function normalizeBaseUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function resolveSiteBaseUrl(): string {
  const candidates = [
    process.env.SOREN_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://varshylai.com',
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) return normalized;
  }
  return 'https://varshylai.com';
}

export function scannerUrl(): string {
  return `${resolveSiteBaseUrl()}/scan/`;
}
