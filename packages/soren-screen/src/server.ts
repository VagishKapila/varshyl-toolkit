export {
  createSorenRouter,
  createQAEngine,
  searchQAPairs,
  getQAPairsForProduct,
  buildPortfolioPdf,
  fetchPortfolioData,
} from './server/index.js';

export type {
  CreateSorenRouterOptions,
  PortfolioBuilderOptions,
  PortfolioPdfBuildResult,
} from './server/index.js';

export type {
  PortfolioData,
  SorenServerConfig,
  SorenQAPair,
  SorenQAResult,
  SorenPortfolioData,
  SorenPortfolioPdfResult,
} from './types.js';
