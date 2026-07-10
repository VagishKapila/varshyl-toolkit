import type { SiteMetadata } from './types.js';

function metaContent(
  html: string,
  attr: 'name' | 'property',
  key: string,
): string | undefined {
  const re = new RegExp(
    `<meta[^>]*${attr}=["']${key}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    'i',
  );
  const alt = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${key}["'][^>]*>`,
    'i',
  );
  return re.exec(html)?.[1]?.trim() || alt.exec(html)?.[1]?.trim() || undefined;
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const nodes: Record<string, unknown>[] = [];
  for (const match of html.matchAll(scriptRegex)) {
    try {
      const raw = (match[1] ?? '').trim();
      if (!raw) continue;
      const json = JSON.parse(raw) as unknown;
      const queue: Record<string, unknown>[] = Array.isArray(json)
        ? [...(json as Record<string, unknown>[])]
        : [json as Record<string, unknown>];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== 'object') continue;
        nodes.push(node);
        const graph = node['@graph'];
        if (Array.isArray(graph)) queue.push(...(graph as Record<string, unknown>[]));
      }
    } catch {
      /* skip invalid JSON-LD */
    }
  }
  return nodes;
}

function nodeType(node: Record<string, unknown>): string | undefined {
  const t = node['@type'];
  if (typeof t === 'string') return t;
  if (Array.isArray(t) && typeof t[0] === 'string') return t[0];
  return undefined;
}

function nodeName(node: Record<string, unknown>): string | undefined {
  const name = node.name;
  return typeof name === 'string' ? name.trim() : undefined;
}

function hasPostalAddress(node: Record<string, unknown>): boolean {
  const addr = node.address;
  if (!addr || typeof addr !== 'object') return false;
  const a = addr as Record<string, unknown>;
  return Boolean(
    a.streetAddress || a.addressLocality || a.postalCode || a.addressCountry,
  );
}

function extractKeywords(html: string): string[] {
  const keywords = metaContent(html, 'name', 'keywords');
  if (keywords) {
    return keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) {
    const text = h1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text) return [text];
  }
  return [];
}

export function extractSiteMetadata(
  html: string,
  url: string,
  platform: string,
): SiteMetadata {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/\s+/g, ' ')
    .trim();

  const description = metaContent(html, 'name', 'description');
  const ogTitle = metaContent(html, 'property', 'og:title');
  const ogDescription = metaContent(html, 'property', 'og:description');
  const ogImage = metaContent(html, 'property', 'og:image');
  const ogUrl = metaContent(html, 'property', 'og:url');
  const twitterCard = metaContent(html, 'name', 'twitter:card');
  const twitterTitle = metaContent(html, 'name', 'twitter:title');
  const twitterDescription = metaContent(html, 'name', 'twitter:description');
  const twitterImage = metaContent(html, 'name', 'twitter:image');

  const canonicalMatch = html.match(
    /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  );
  const canonicalUrl = canonicalMatch?.[1]?.trim();

  const jsonLd = extractJsonLd(html);
  let orgName: string | undefined;
  let hasAddress = false;
  for (const node of jsonLd) {
    const type = nodeType(node);
    if (type === 'Organization' || type === 'LocalBusiness' || type === 'Corporation') {
      orgName = orgName || nodeName(node);
    }
    if (type === 'LocalBusiness' && hasPostalAddress(node)) {
      hasAddress = true;
      orgName = orgName || nodeName(node);
    }
  }

  const h1Matches = html.match(/<h1\b[^>]*>/gi);
  const h2Matches = html.match(/<h2\b[^>]*>/gi);

  return {
    url,
    platform,
    title: title || ogTitle,
    description: description || ogDescription,
    ogImage,
    ogTitle,
    ogDescription,
    ogUrl: ogUrl || canonicalUrl || url,
    twitterCard,
    twitterTitle: twitterTitle || ogTitle || title,
    twitterDescription: twitterDescription || ogDescription || description,
    twitterImage: twitterImage || ogImage,
    orgName,
    canonicalUrl: canonicalUrl || url,
    hasAddress,
    hasH1: (h1Matches?.length ?? 0) > 0,
    hasH2: (h2Matches?.length ?? 0) > 0,
    h1Count: h1Matches?.length ?? 0,
    keywords: extractKeywords(html),
  };
}

export function inferJsonLdType(meta: SiteMetadata): string {
  if (meta.hasAddress) return 'LocalBusiness';
  if (meta.orgName) return 'Organization';
  return 'WebSite';
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url.replace(/https?:\/\//gi, '').replace(/\/$/, '');
  }
}
