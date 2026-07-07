import type { Platform } from './platform-detector.js';

export interface FailingCheck {
  name: string;
  tip: string;
}

export interface FixFile {
  filename: string;
  content: string;
  description: string;
}

export interface FixInstruction {
  step: number;
  title: string;
  detail: string;
}

export interface FixPackage {
  platform: Platform;
  summary: string;
  files: FixFile[];
  instructions: FixInstruction[];
  sorenSays: string;
  creditsRequired: number;
}

export function generateFixPackage(
  platform: Platform,
  failingChecks: FailingCheck[],
  siteInfo: {
    url: string;
    productName?: string;
    companyName?: string;
  },
): FixPackage {
  const domain = siteInfo.url
    .replace(/https?:\/\//gi, '')
    .replace(/www\./gi, '')
    .replace(/\/$/, '');

  const productName = siteInfo.productName || domain;
  const companyName = siteInfo.companyName || domain;

  const fixes = buildFixes(
    failingChecks,
    productName,
    companyName,
    siteInfo.url,
  );

  switch (platform) {
    case 'wordpress':
      return buildWordPressPackage(
        fixes,
        productName,
        companyName,
        siteInfo.url,
      );

    case 'squarespace':
      return buildCodeInjectionPackage(
        fixes,
        'squarespace',
        productName,
      );

    case 'wix':
      return buildCodeInjectionPackage(
        fixes,
        'wix',
        productName,
      );

    case 'webflow':
      return buildCodeInjectionPackage(
        fixes,
        'webflow',
        productName,
      );

    case 'shopify':
      return buildShopifyPackage(
        fixes,
        productName,
      );

    case 'nextjs':
      return buildNextJsPackage(
        fixes,
        productName,
        companyName,
        siteInfo.url,
      );

    default:
      return buildStaticHtmlPackage(
        fixes,
        productName,
      );
  }
}

function buildFixes(
  checks: FailingCheck[],
  productName: string,
  companyName: string,
  url: string,
): string {
  const checkNames = checks.map((c) => c.name);
  let code = '';

  if (checkNames.includes('JSON-LD script')) {
    code += `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "${productName}",
  "url": "${url}",
  "applicationCategory": "BusinessApplication",
  "offers": { "@type": "Offer", "price": "0" },
  "publisher": {
    "@type": "Organization",
    "name": "${companyName}",
    "url": "${url}"
  }
}
</script>`;
  }

  if (checkNames.includes('Open Graph tags')) {
    code += `
<meta property="og:title" content="${productName}">
<meta property="og:description" content="${productName} — learn more at ${url}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">`;
  }

  if (checkNames.includes('Twitter card tag')) {
    code += `
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${productName}">`;
  }

  if (checkNames.includes('Canonical link')) {
    code += `
<link rel="canonical" href="${url}">`;
  }

  return code.trim();
}

function buildWordPressPackage(
  fixes: string,
  productName: string,
  companyName: string,
  url: string,
): FixPackage {
  const pluginCode = `<?php
/**
 * Plugin Name: GEO Fix by Soren
 * Description: AI discoverability fixes for ${productName}
 * Version: 1.0.0
 * Author: Soren by Varshyl
 */

if (!defined('ABSPATH')) exit;

add_action('wp_head', function() {
  echo '${fixes.replace(/'/g, "\\'")}';
});
`;

  const llmsTxt = `# ${productName}
# ${url}

## What this product does
${productName} — add your description here.

## Who uses it
Add your target audience here.

## Key facts
URL: ${url}
Company: ${companyName}
`;

  return {
    platform: 'wordpress',
    summary: 'WordPress plugin + llms.txt file',
    files: [
      {
        filename: 'soren-geo-fix.php',
        content: pluginCode,
        description:
          'Upload this plugin to WordPress → Plugins → Add New → Upload',
      },
      {
        filename: 'llms.txt',
        content: llmsTxt,
        description:
          'Upload this file to your website root folder via FTP or File Manager',
      },
    ],
    instructions: [
      {
        step: 1,
        title: 'Download the plugin file',
        detail: 'Download soren-geo-fix.php from this page',
      },
      {
        step: 2,
        title: 'Go to WordPress Plugins',
        detail: 'In your WordPress dashboard: Plugins → Add New → Upload Plugin',
      },
      {
        step: 3,
        title: 'Upload and activate',
        detail: 'Select the file, click Install Now, then Activate',
      },
      {
        step: 4,
        title: 'Upload llms.txt',
        detail: 'Upload llms.txt to your website root via Plugins → File Manager or FTP',
      },
    ],
    sorenSays:
      'I generated a WordPress plugin with your fixes pre-filled. ' +
      'Install it in three clicks. ' +
      'Then re-run the audit and we should hit 100.',
    creditsRequired: 5,
  };
}

function buildCodeInjectionPackage(
  fixes: string,
  platform: 'squarespace' | 'wix' | 'webflow',
  productName: string,
): FixPackage {
  const paths: Record<string, string> = {
    squarespace:
      'Settings → Advanced → Code Injection → Header',
    wix:
      'Settings → Custom Code → Add Code → Head',
    webflow:
      'Site Settings → Custom Code → Head Code',
  };

  return {
    platform,
    summary: `Code snippet for ${platform} Code Injection`,
    files: [
      {
        filename: 'head-code-snippet.html',
        content: fixes,
        description: `Paste this into your ${platform} head code section`,
      },
    ],
    instructions: [
      {
        step: 1,
        title: 'Copy the code snippet',
        detail: 'Copy the contents of head-code-snippet.html',
      },
      {
        step: 2,
        title: `Open ${platform} settings`,
        detail: `Go to ${paths[platform]}`,
      },
      {
        step: 3,
        title: 'Paste and save',
        detail: 'Paste the code and click Save or Publish',
      },
    ],
    sorenSays:
      `I generated the exact code for your ${platform} site. ` +
      'Paste it in three steps. ' +
      'No technical skills needed.',
    creditsRequired: 5,
  };
}

function buildShopifyPackage(
  fixes: string,
  productName: string,
): FixPackage {
  return {
    platform: 'shopify',
    summary: 'Shopify theme.liquid code insertion',
    files: [
      {
        filename: 'shopify-head-code.html',
        content: fixes,
        description:
          'Add this code to theme.liquid before </head>',
      },
    ],
    instructions: [
      {
        step: 1,
        title: 'Go to Online Store → Themes',
        detail: 'In Shopify admin: Online Store → Themes → Edit Code',
      },
      {
        step: 2,
        title: 'Open theme.liquid',
        detail: 'Find theme.liquid in the Layout folder',
      },
      {
        step: 3,
        title: 'Paste before </head>',
        detail: 'Find </head> and paste the code directly above it',
      },
      {
        step: 4,
        title: 'Save',
        detail: 'Click Save. Changes are live immediately.',
      },
    ],
    sorenSays:
      'I generated the exact Shopify code. ' +
      'Four steps in your theme editor.',
    creditsRequired: 5,
  };
}

function buildNextJsPackage(
  fixes: string,
  productName: string,
  companyName: string,
  url: string,
): FixPackage {
  const layoutCode = `// Add to your app/layout.tsx metadata export:
export const metadata = {
  title: '${productName}',
  metadataBase: new URL('${url}'),
  openGraph: {
    title: '${productName}',
    url: '${url}',
    siteName: '${productName}',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '${productName}',
  },
  alternates: {
    canonical: '${url}',
  },
};

// Add JSON-LD to your layout body:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "${productName}",
    "url": "${url}",
    "publisher": {
      "@type": "Organization",
      "name": "${companyName}"
    }
  })}}
/>`;

  return {
    platform: 'nextjs',
    summary: 'Next.js layout.tsx metadata changes',
    files: [
      {
        filename: 'layout-changes.tsx',
        content: layoutCode,
        description:
          'Add these changes to your app/layout.tsx file',
      },
    ],
    instructions: [
      {
        step: 1,
        title: 'Open app/layout.tsx',
        detail: 'Find your root layout file in your Next.js project',
      },
      {
        step: 2,
        title: 'Add metadata export',
        detail: 'Copy the metadata object and export it from layout.tsx',
      },
      {
        step: 3,
        title: 'Add JSON-LD script',
        detail: 'Add the script tag inside your <body> before {children}',
      },
      {
        step: 4,
        title: 'Deploy',
        detail: 'Push to main. Your changes go live automatically.',
      },
    ],
    sorenSays:
      'I generated the exact layout changes. ' +
      'Four steps in your codebase. ' +
      'Or I can open a GitHub pull request for you.',
    creditsRequired: 5,
  };
}

function buildStaticHtmlPackage(
  fixes: string,
  productName: string,
): FixPackage {
  return {
    platform: 'static-html',
    summary: 'HTML snippet for your page head',
    files: [
      {
        filename: 'head-snippet.html',
        content: fixes,
        description:
          'Add this code before </head> on every page',
      },
    ],
    instructions: [
      {
        step: 1,
        title: 'Open your HTML file',
        detail: 'Find your main index.html or layout file',
      },
      {
        step: 2,
        title: 'Find the </head> tag',
        detail: 'Use Ctrl+F or Cmd+F to search for </head>',
      },
      {
        step: 3,
        title: 'Paste the snippet above it',
        detail: 'Copy the snippet and paste it directly before </head>',
      },
    ],
    sorenSays:
      'I generated a single HTML snippet. ' +
      'Paste it before your closing head tag. ' +
      'Works on any website.',
    creditsRequired: 5,
  };
}
