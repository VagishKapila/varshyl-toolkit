import { expect, test } from 'vitest';
import {
  buildAuditComparison,
  gradeFromScore,
  parseCompareQuery,
} from '../geo-audit-comparison.js';

test('gradeFromScore maps percentage thresholds', () => {
  expect(gradeFromScore(92)).toBe('A');
  expect(gradeFromScore(78)).toBe('B');
  expect(gradeFromScore(60)).toBe('C');
});

test('buildAuditComparison returns newly passing checks when score improved', () => {
  const comparison = buildAuditComparison(
    99,
    [
      { name: 'sitemap.xml', passed: true, points: 10, maxPoints: 10, tip: '', category: 'AI discoverability' },
      { name: 'Landmarks', passed: true, points: 5, maxPoints: 5, tip: '', category: 'Accessibility basics' },
      { name: 'Alt text', passed: false, points: 0, maxPoints: 5, tip: '', category: 'Accessibility basics' },
    ],
    78,
    [
      { name: 'sitemap.xml', passed: false },
      { name: 'Landmarks', passed: false },
      { name: 'Alt text', passed: false },
    ],
  );
  expect(comparison).toEqual({
    previousScore: 78,
    previousGrade: 'B',
    improvement: 21,
    newlyPassing: ['sitemap.xml', 'Landmarks'],
    issuesFixed: 2,
  });
});

test('buildAuditComparison omitted when score did not improve', () => {
  expect(
    buildAuditComparison(70, [], 78, [{ name: 'x', passed: false }]),
  ).toBeUndefined();
});

test('parseCompareQuery accepts valid scores', () => {
  expect(parseCompareQuery('78')).toBe(78);
  expect(parseCompareQuery('bad')).toBeUndefined();
});
