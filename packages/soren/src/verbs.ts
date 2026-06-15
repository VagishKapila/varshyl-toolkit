/**
 * The 5 verbs — the spine of the whole tool. A product adapter implements
 * these server-side. `update` is deferred to v2 on purpose; keep the set
 * small and human.
 */
export const SOREN_VERBS = ['find', 'attach', 'create', 'file', 'delete'] as const;
export type SorenVerbName = (typeof SOREN_VERBS)[number];

/** Coarse time window for `find`. Adapters may accept extra string windows. */
export type SorenWhen = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all' | (string & Record<never, never>);

export type SorenMediaType = 'photo' | 'video' | 'document' | 'file';

/** How a verb points at an existing record. */
export interface SorenTarget {
  readonly recordType?: string;
  readonly id?: string;
  readonly query?: string;
}

/** find { type, when?, filter?, limit? } → read-only query, spoken summary + card. */
export interface SorenFindParams {
  readonly type: string;
  readonly when?: SorenWhen;
  readonly filter?: string;
  readonly limit?: number;
}

/** attach { mediaType, target?, note?, source? } — add a photo/video/document/file. */
export interface SorenAttachParams {
  readonly mediaType: SorenMediaType;
  readonly target?: SorenTarget;
  readonly note?: string;
  readonly source?: 'camera' | 'gallery' | 'upload' | (string & Record<never, never>);
  /** Ids of already-known media (e.g. results from a prior `find`). */
  readonly mediaIds?: readonly string[];
}

/** create { recordType, fields } — make a new record. */
export interface SorenCreateParams {
  readonly recordType: string;
  readonly fields: Record<string, unknown>;
}

/** file { entryType, payload, when? } — file a log / invoice / etc. */
export interface SorenFileParams {
  readonly entryType: 'log' | 'invoice' | (string & Record<never, never>);
  readonly payload: Record<string, unknown>;
  readonly when?: SorenWhen;
}

/**
 * delete { recordType?, id?, query? } — ALWAYS gated by a confirm card.
 * `confirmed` is advisory: the adapter must re-resolve the target at execution
 * time and refuse to delete blind on a stale / double-tapped card.
 */
export interface SorenDeleteParams {
  readonly recordType?: string;
  readonly id?: string;
  readonly query?: string;
  readonly confirmed?: boolean;
}

export interface SorenVerbParams {
  readonly find: SorenFindParams;
  readonly attach: SorenAttachParams;
  readonly create: SorenCreateParams;
  readonly file: SorenFileParams;
  readonly delete: SorenDeleteParams;
}
