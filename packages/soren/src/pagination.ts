import type { SorenCardMeta } from './cards';

/**
 * Default page size for `find`. Big result sets get a defined answer
 * ("showing N of M") instead of each adapter improvising.
 */
export const DEFAULT_FIND_LIMIT = 20;

export interface SorenPage<T> {
  readonly page: readonly T[];
  readonly shown: number;
  readonly total: number;
  readonly truncated: boolean;
}

export function paginate<T>(all: readonly T[], limit: number = DEFAULT_FIND_LIMIT): SorenPage<T> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_FIND_LIMIT;
  const page = all.slice(0, safeLimit);
  return { page, shown: page.length, total: all.length, truncated: all.length > page.length };
}

/** Card meta carrying counts, for the "showing N of M" convention. */
export function paginationMeta(shown: number, total: number): SorenCardMeta {
  return { shown, total };
}

/** Human subtitle for a truncated list, or `undefined` when nothing was cut. */
export function showingSubtitle(shown: number, total: number): string | undefined {
  return total > shown ? `Showing ${shown} of ${total}` : undefined;
}
