function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSitemap(url: string, routes: string[]): string {
  const baseUrl = url.replace(/\/+$/, '');
  const normalizedRoutes = new Set(['/', ...routes.map((route) => (route.startsWith('/') ? route : `/${route}`))]);
  const today = new Date().toISOString().slice(0, 10);

  const entries = [...normalizedRoutes]
    .map((route) => {
      const loc = route === '/' ? baseUrl : `${baseUrl}${route}`;
      return [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
  ].join('\n');
}
