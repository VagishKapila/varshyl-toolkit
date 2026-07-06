import React from 'react';
import { GEO } from '../index.js';
import type { GEOConfig } from '../types.js';

export interface GEOMetaProps {
  config: GEOConfig;
  pageTitle?: string;
  pageDescription?: string;
}

export function GEOMeta({ config, pageTitle, pageDescription }: GEOMetaProps): JSX.Element {
  const geo = new GEO(config);
  const title = pageTitle ?? config.product.name;
  const description = pageDescription ?? config.product.tagline;
  const canonical = config.product.url;
  const jsonLd = JSON.stringify(geo.jsonLd());

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={config.company.name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:url" content={canonical} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <link rel="canonical" href={canonical} />
    </>
  );
}
