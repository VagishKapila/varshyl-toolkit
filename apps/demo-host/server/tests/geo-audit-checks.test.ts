import { expect, test } from 'vitest';
import {
  ADA_CATEGORY,
  buildAccessibilityChecks,
  buildSecurityChecks,
  checkAltText,
  checkFormLabels,
  checkHeadingHierarchy,
  checkLandmarks,
  checkLangAttribute,
  scoreFromChecks,
  SECURITY_CATEGORY,
} from '../geo-audit-checks.js';

test('alt text scores partially when some images lack alt', () => {
  const html = '<img src="a.jpg" alt="Logo"><img src="b.jpg">';
  expect(checkAltText(html)).toEqual({ passed: false, points: 3 });
});

test('heading hierarchy fails on skipped levels', () => {
  const html = '<h1>Title</h1><h3>Skipped</h3>';
  expect(checkHeadingHierarchy(html)).toEqual({ passed: false, points: 2 });
});

test('form labels pass when inputs are wrapped in labels', () => {
  const html = '<label>Name <input type="text"></label>';
  expect(checkFormLabels(html)).toEqual({ passed: true, points: 5 });
});

test('landmarks award partial points', () => {
  const html = '<header></header><main></main>';
  expect(checkLandmarks(html)).toEqual({ passed: false, points: 2 });
});

test('lang attribute requires non-empty lang', () => {
  expect(checkLangAttribute('<html><body></body></html>')).toEqual({
    passed: false,
    points: 0,
  });
  expect(checkLangAttribute('<html lang="en"><body></body></html>')).toEqual({
    passed: true,
    points: 5,
  });
});

test('accessibility checks include informational color contrast item', () => {
  const checks = buildAccessibilityChecks('<html lang="en"><main></main>');
  const contrast = checks.find((c) => c.name === 'Color contrast');
  expect(contrast?.info).toBe(true);
  expect(contrast?.maxPoints).toBe(0);
  expect(contrast?.passed).toBe(true);
});

test('security checks read response headers', () => {
  const checks = buildSecurityChecks({
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
    'content-security-policy': "default-src 'self'",
  });
  expect(checks.every((c) => c.category === SECURITY_CATEGORY)).toBe(true);
  expect(checks.every((c) => c.passed)).toBe(true);
});

test('score is percentage of 140 scorable points', () => {
  const checks = buildAccessibilityChecks('<html lang="en"></html>');
  const earned = checks.reduce((sum, c) => sum + c.points, 0);
  expect(scoreFromChecks(checks)).toBe(Math.round((earned / 140) * 100));
});

test('accessibility checks use Accessibility basics category', () => {
  const checks = buildAccessibilityChecks('<html></html>');
  expect(checks.every((c) => c.category === ADA_CATEGORY)).toBe(true);
});
