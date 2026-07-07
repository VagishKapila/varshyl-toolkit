export type Platform =
  | 'wordpress'
  | 'squarespace'
  | 'wix'
  | 'webflow'
  | 'shopify'
  | 'nextjs'
  | 'static-html'
  | 'unknown';

export interface PlatformResult {
  platform: Platform;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
  fixApproach: string;
}

export function detectPlatform(
  html: string,
  headers: Record<string, string>,
): PlatformResult {
  const signals: string[] = [];

  if (
    html.includes('wp-content/') ||
    html.includes('wp-includes/') ||
    html.includes('/wp-json/') ||
    html.includes('wordpress')
  ) {
    signals.push('wp-content detected');
    return {
      platform: 'wordpress',
      confidence: 'high',
      signals,
      fixApproach:
        'I can generate a WordPress plugin. ' +
        'Install it in one click from your dashboard.',
    };
  }

  if (
    html.includes('static.squarespace.com') ||
    html.includes('squarespace-cdn.com') ||
    html.includes('squarespace.com/universal')
  ) {
    signals.push('squarespace CDN detected');
    return {
      platform: 'squarespace',
      confidence: 'high',
      signals,
      fixApproach:
        'I can give you exact code to paste ' +
        'in Squarespace Settings → Advanced → ' +
        'Code Injection. Takes two minutes.',
    };
  }

  if (
    html.includes('wixstatic.com') ||
    html.includes('wix.com/') ||
    html.includes('_wix_browser_') ||
    html.includes('wixsite.com')
  ) {
    signals.push('wix CDN detected');
    return {
      platform: 'wix',
      confidence: 'high',
      signals,
      fixApproach:
        'I can give you exact code for ' +
        'Wix Settings → Custom Code. ' +
        'Three steps, no tech skills needed.',
    };
  }

  if (
    html.includes('webflow.io') ||
    html.includes('data-wf-page') ||
    html.includes('data-wf-site') ||
    html.includes('webflow.com/css')
  ) {
    signals.push('webflow attributes detected');
    return {
      platform: 'webflow',
      confidence: 'high',
      signals,
      fixApproach:
        'I can give you the exact embed code ' +
        'for Webflow Page Settings. ' +
        'Paste and publish.',
    };
  }

  if (
    html.includes('cdn.shopify.com') ||
    html.includes('myshopify.com') ||
    html.includes('Shopify.shop') ||
    html.includes('shopify-section')
  ) {
    signals.push('shopify CDN detected');
    return {
      platform: 'shopify',
      confidence: 'high',
      signals,
      fixApproach:
        'I can give you the exact code ' +
        'for your Shopify theme.liquid file ' +
        'with line-by-line instructions.',
    };
  }

  if (
    html.includes('__NEXT_DATA__') ||
    html.includes('/_next/static/') ||
    html.includes('next/dist/') ||
    (headers['x-powered-by'] || '')
      .toLowerCase().includes('next.js')
  ) {
    signals.push('Next.js detected');
    return {
      platform: 'nextjs',
      confidence: 'high',
      signals,
      fixApproach:
        'I can generate the exact code ' +
        'changes for your Next.js layout file. ' +
        'Or I can open a GitHub pull request.',
    };
  }

  if (html.includes('<!DOCTYPE html') ||
      html.includes('<html')) {
    return {
      platform: 'static-html',
      confidence: 'medium',
      signals: ['plain HTML page'],
      fixApproach:
        'I can give you a single HTML snippet ' +
        'to add before your closing head tag. ' +
        'Works on any website.',
    };
  }

  return {
    platform: 'unknown',
    confidence: 'low',
    signals: [],
    fixApproach:
      'I can give you a universal fix ' +
      'that works on any platform.',
  };
}
