import { expect, test } from 'vitest';
import { detectPlatform } from '../platform-detector.js';

test('detects WordPress from wp-content', () => {
  const html = '<link href="/wp-content/themes/x/style.css">';
  const r = detectPlatform(html, {});
  expect(r.platform).toBe('wordpress');
  expect(r.confidence).toBe('high');
});

test('detects Squarespace from CDN', () => {
  const html = '<img src="https://static.squarespace.com/img.png">';
  const r = detectPlatform(html, {});
  expect(r.platform).toBe('squarespace');
});

test('detects Wix from wixstatic', () => {
  const html = '<script src="https://static.wixstatic.com/services/main.js">';
  const r = detectPlatform(html, {});
  expect(r.platform).toBe('wix');
});

test('detects Webflow from data-wf-page', () => {
  const html = '<html data-wf-page="abc123">';
  const r = detectPlatform(html, {});
  expect(r.platform).toBe('webflow');
});

test('detects Shopify from CDN', () => {
  const html = '<script src="https://cdn.shopify.com/s/files/1/app.js">';
  const r = detectPlatform(html, {});
  expect(r.platform).toBe('shopify');
});

test('detects Next.js from __NEXT_DATA__', () => {
  const html = '<script id="__NEXT_DATA__" type="application/json">';
  const r = detectPlatform(html, {});
  expect(r.platform).toBe('nextjs');
});

test('detects static HTML fallback', () => {
  const html = '<!DOCTYPE html><html><head></head></html>';
  const r = detectPlatform(html, {});
  expect(r.platform).toBe('static-html');
});

test('fixApproach is plain English for all platforms', () => {
  const platforms = [
    '<script src="wp-content/"></script>',
    '<img src="static.squarespace.com/x">',
    '<script src="wixstatic.com/x">',
    '<html data-wf-page="x">',
    '<script src="cdn.shopify.com/x">',
    '<script id="__NEXT_DATA__">',
  ];
  platforms.forEach((html) => {
    const r = detectPlatform(html, {});
    expect(r.fixApproach.length).toBeGreaterThan(10);
    expect(r.fixApproach).not.toMatch(/undefined/);
  });
});
