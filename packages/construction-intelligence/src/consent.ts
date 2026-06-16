export type ConsentChecker = (
  userId: string,
  consentKey: string,
  productSlug: string,
  version: string
) => Promise<boolean>;

/**
 * Gate for CIE ingestion.
 * Call this before sending any real project data to the CIE.
 * If user has not consented → skip ingestion silently.
 */
export async function hasIntelligenceConsent(
  hasUserConsented: ConsentChecker,
  userId: string,
  productSlug: string = 'jobsite-intel'
): Promise<boolean> {
  return hasUserConsented(userId, 'ai_training', productSlug, '1.0.0');
}
