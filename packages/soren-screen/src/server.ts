export {
  createSorenRouter,
  searchQAPairs,
  getQAPairsForProduct,
  buildPortfolioPdf,
  fetchPortfolioData,
} from './server/index.js';

export type {
  CreateSorenRouterOptions,
  PortfolioBuilderOptions,
} from './server/index.js';

export type {
  SorenServerConfig,
  SorenQAPair,
  SorenQAResult,
  SorenPortfolioData,
  SorenPortfolioPdfResult,
} from './types.js';
