# @varshylinc/soren-screen

## 0.2.0
### Minor Changes
- pgvector semantic Q&A search via OpenAI
  text-embedding-3-small (optional peer)
- Auto-seed 200 Q&A pairs into pgvector on first request
- Keyword fallback mode preserved (no DB required)
- Voice input on mic button — Web Speech API +
  Capacitor speech recognition fallback
- Real PDF generation via pdf-lib (no storage dep)
- Storage adapter contract — host provides upload fn
- PortfolioData interface for typed dataSource returns

## 0.1.0

### Added

- Initial release: `SorenScreen`, `SorenGreeting`, `SorenIdentity`, `SorenActions`, `SorenPortfolio`, `SorenInput`
- JobSite Intel adapter with 200 Q&A pairs
- Server routes: `/soren/qa`, `/soren/portfolio/:userId`
- Portfolio PDF builder via Claude Haiku
- Subpath exports: `.`, `./react`, `./server`, `./adapters/jobsite`, `./adapters/reference`
- Shared types: `SorenConfig`, `SorenAction`, `SorenQAPair`, `SorenPortfolioConfig`, `SorenCard`, `SorenSession`
