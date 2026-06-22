/** Built-in Soren flows triggered from action cards. */
export type SorenBuiltinFlow =
  | 'portfolio-builder'
  | 'client-notification'
  | 'qa';

/** Route path, built-in flow id, or host callback. */
export type SorenActionOnTap = string | SorenBuiltinFlow | (() => void);

/** Action card shown in the 2×2 grid on the Soren home screen. */
export interface SorenAction {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  onTap: SorenActionOnTap;
}

/** Question/answer pair for the keyword Q&A engine. */
export interface SorenQAPair {
  q: string;
  a: string;
  tags?: string[];
}

/** Result returned by the Q&A search endpoint or client hook. */
export interface SorenQAResult {
  answer: string;
  confidence: number;
  outOfScope: boolean;
}

export type SorenShareTarget = 'linkedin' | 'tiktok' | 'instagram' | (string & {});

export type SorenPdfTemplate = 'construction-superintendent' | (string & {});

/** Portfolio stats surfaced on the Soren portfolio card. */
export interface SorenPortfolioData {
  projects: number;
  logCount: number;
  yearsActive: number;
  skills: string[];
}

/** Portfolio builder configuration passed by the host product. */
export interface SorenPortfolioConfig {
  enabled: boolean;
  dataSource?: (userId: string) => Promise<SorenPortfolioData>;
  pdfTemplate?: SorenPdfTemplate;
  shareTargets?: SorenShareTarget[];
}

export type SorenCardType =
  | 'greeting'
  | 'identity'
  | 'action'
  | 'qa'
  | 'portfolio'
  | 'message';

/** Result surface rendered in the Soren chat thread. */
export interface SorenCard {
  type: SorenCardType;
  data: Record<string, unknown>;
}

/** Minimal user identity for greeting and session persistence. */
export interface SorenUser {
  userId: string;
  firstName: string;
  title?: string;
  name?: string;
}

/** Persisted Soren session stored per product in localStorage. */
export interface SorenSession {
  userId: string;
  firstName: string;
  title?: string;
  name?: string;
  productId: string;
}

export type SorenQAAdapter =
  | 'jobsite'
  | 'reference'
  | string
  | ((query: string) => Promise<SorenQAResult>);

/**
 * Product configuration contract for @varshylinc/soren-screen.
 * Passed once by the host; drives greeting, actions, Q&A, and portfolio flows.
 */
export interface SorenConfig {
  productId: string;
  productName: string;
  avatarEmoji: string;
  greeting: (user: SorenUser) => string;
  titleOptions: string[];
  actions: SorenAction[];
  qaAdapter?: SorenQAAdapter;
  portfolio?: SorenPortfolioConfig;
  serverUrl?: string;
}

/** Host adapter for resolving product-specific user records. */
export interface SorenUserAdapter {
  getUserById(userId: string): Promise<SorenUser | null>;
}

/** Host adapter for Q&A pair lookup (optional override of built-in adapters). */
export interface SorenQAAdapterContract {
  search(query: string, productId: string): Promise<SorenQAResult>;
  listPairs?(productId: string): Promise<SorenQAPair[]>;
}

/** Server module configuration for Express router mounting. */
export interface SorenServerConfig {
  productId: string;
  qaPairs?: SorenQAPair[];
  portfolio?: SorenPortfolioConfig;
  anthropicApiKey?: string;
}

/** Chat message in the Soren conversation thread. */
export interface SorenChatMessage {
  id: string;
  role: 'soren' | 'user';
  content: string;
  timestamp: string;
}

/** Portfolio PDF generation result from the server builder. */
export interface SorenPortfolioPdfResult {
  summary: string;
  pdfUrl: string;
}
