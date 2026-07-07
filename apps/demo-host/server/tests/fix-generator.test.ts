import { expect, test } from 'vitest';
import { generateFixPackage } from '../fix-generator.js';

const wordPressSite = {
  url: 'https://example.com',
  productName: 'Example Product',
  companyName: 'Example Co',
};

const failingChecks = [
  { name: 'JSON-LD script', tip: 'Add JSON-LD' },
  { name: 'Open Graph tags', tip: 'Add OG tags' },
];

test('WordPress returns a PHP plugin file', () => {
  const pkg = generateFixPackage(
    'wordpress',
    failingChecks,
    wordPressSite,
  );
  expect(pkg.platform).toBe('wordpress');
  expect(pkg.files[0].filename).toBe('soren-geo-fix.php');
  expect(pkg.files[0].content).toContain('<?php');
  expect(pkg.files[0].content).toContain('wp_head');
});

test('WordPress includes llms.txt', () => {
  const pkg = generateFixPackage(
    'wordpress',
    failingChecks,
    wordPressSite,
  );
  const llms = pkg.files.find((f) => f.filename === 'llms.txt');
  expect(llms).toBeDefined();
});

test('Squarespace returns HTML snippet', () => {
  const pkg = generateFixPackage(
    'squarespace',
    failingChecks,
    wordPressSite,
  );
  expect(pkg.files[0].filename).toBe('head-code-snippet.html');
  expect(pkg.files[0].content).toContain('application/ld+json');
});

test('Next.js returns layout changes', () => {
  const pkg = generateFixPackage(
    'nextjs',
    failingChecks,
    wordPressSite,
  );
  expect(pkg.files[0].filename).toBe('layout-changes.tsx');
  expect(pkg.files[0].content).toContain('metadata');
});

test('creditsRequired is 5 for all platforms', () => {
  const platforms = [
    'wordpress',
    'squarespace',
    'wix',
    'shopify',
    'nextjs',
    'static-html',
  ] as const;
  platforms.forEach((p) => {
    const pkg = generateFixPackage(p, failingChecks, wordPressSite);
    expect(pkg.creditsRequired).toBe(5);
  });
});

test('sorenSays is plain English under 30 words', () => {
  const pkg = generateFixPackage(
    'wordpress',
    failingChecks,
    wordPressSite,
  );
  const words = pkg.sorenSays.split(' ').length;
  expect(words).toBeLessThan(30);
});

test('all instructions have step number and title', () => {
  const pkg = generateFixPackage(
    'wordpress',
    failingChecks,
    wordPressSite,
  );
  pkg.instructions.forEach((ins, i) => {
    expect(ins.step).toBe(i + 1);
    expect(ins.title.length).toBeGreaterThan(3);
    expect(ins.detail.length).toBeGreaterThan(5);
  });
});
