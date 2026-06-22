/** Package version — useful for debugging and compatibility checks */
export const VERSION = '0.2.0' as const;

/** Utility: returns time-of-day greeting word */
export function timeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export type {
  SorenAction,
  SorenActionOnTap,
  SorenBuiltinFlow,
  SorenCard,
  SorenCardType,
  SorenChatMessage,
  SorenConfig,
  SorenPdfTemplate,
  SorenPortfolioConfig,
  SorenPortfolioData,
  PortfolioData,
  SorenPortfolioPdfResult,
  SorenQAAdapter,
  SorenQAAdapterContract,
  SorenQAPair,
  SorenQAResult,
  SorenServerConfig,
  SorenSession,
  SorenShareTarget,
  SorenUser,
  SorenUserAdapter,
} from './types.js';
