import type { AuditCheckResult } from './geo-audit-checks.js';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface PreviousCheckSnapshot {
  name: string;
  passed: boolean;
}

export interface AuditComparison {
  previousScore: number;
  previousGrade: Grade;
  improvement: number;
  newlyPassing: string[];
  issuesFixed: number;
}

export function gradeFromScore(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 55) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export function buildAuditComparison(
  score: number,
  checks: AuditCheckResult[],
  previousScore: number,
  previousChecks: PreviousCheckSnapshot[] | undefined,
): AuditComparison | undefined {
  if (!Number.isFinite(previousScore) || previousScore < 0 || previousScore > 100) {
    return undefined;
  }
  const improvement = score - previousScore;
  if (improvement <= 0 || !previousChecks?.length) return undefined;

  const wasFailing = new Set(
    previousChecks.filter((c) => !c.passed).map((c) => c.name),
  );
  const newlyPassing = checks
    .filter((c) => c.passed && !c.info && wasFailing.has(c.name))
    .map((c) => c.name);

  return {
    previousScore,
    previousGrade: gradeFromScore(previousScore),
    improvement,
    newlyPassing,
    issuesFixed: newlyPassing.length,
  };
}

export function parseCompareQuery(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) return undefined;
  return Math.round(n);
}
