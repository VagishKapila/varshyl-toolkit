import { expect } from 'vitest';

export type ExportKind = 'function' | 'class' | 'const' | 'array';

export function expectNamedExport(
  moduleNs: Record<string, unknown>,
  name: string,
  kind: ExportKind,
): void {
  const value = moduleNs[name];
  expect(value, `missing export: ${name}`).toBeDefined();
  if (kind === 'function' || kind === 'class') {
    expect(typeof value, `${name} should be a function`).toBe('function');
  } else if (kind === 'array') {
    expect(Array.isArray(value), `${name} should be an array`).toBe(true);
  }
}

export function expectNotOnBarrel(moduleNs: Record<string, unknown>, name: string): void {
  expect(moduleNs[name], `internal symbol leaked: ${name}`).toBeUndefined();
}
