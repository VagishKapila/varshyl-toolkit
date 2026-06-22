import type { SorenQAPair } from '../../types.js';

export const REFERENCE_QA: SorenQAPair[] = [
  { q: 'What is Soren?', a: 'Soren is a demo AI assistant screen from the soren-screen toolkit package.', tags: ['demo'] },
  { q: 'How do I use the reference adapter?', a: 'Import jobsiteConfig or referenceConfig and render <SorenScreen config={...} />.', tags: ['demo'] },
  { q: 'Does reference adapter call Claude?', a: 'Only if you wire server routes with ANTHROPIC_API_KEY — otherwise template fallbacks.', tags: ['demo'] },
  { q: 'How many Q&A pairs are in reference?', a: 'Twenty demo pairs for testing without a real product backend.', tags: ['demo'] },
  { q: 'Can I test portfolio?', a: 'Yes — tap My Portfolio; demo stats load without a data source.', tags: ['demo'] },
  { q: 'How do I test Q&A?', a: 'Type a question that matches a reference Q&A pair keyword.', tags: ['demo'] },
  { q: 'What is the sage color?', a: 'Design token #7C9B8A — from the approved Soren mockup.', tags: ['demo'] },
  { q: 'What products use Soren?', a: 'JobSite Intel, BrandOS, and future Varshyl apps via adapters.', tags: ['demo'] },
  { q: 'Is Express required?', a: 'Only for server Q&A routes — import from the soren-screen/server subpath.', tags: ['demo'] },
  { q: 'How do I mount the router?', a: 'app.use("/soren", createSorenRouter({ productId: "reference", qaRegistry }))', tags: ['demo'] },
  { q: 'What is out of scope?', a: 'Ask about pizza — reference returns outOfScope for unrelated queries.', tags: ['demo'] },
  { q: 'How do identity chips work?', a: 'Pick a title and enter your name — stored in localStorage per productId.', tags: ['demo'] },
  { q: 'What is portfolio PDF?', a: 'POST /soren/portfolio/:userId/pdf returns summary and signed URL.', tags: ['demo'] },
  { q: 'Does reference have daily log?', a: 'First action card routes to /log/new as a demo path.', tags: ['demo'] },
  { q: 'How do I run tests?', a: 'pnpm test --filter soren-screen', tags: ['demo'] },
  { q: 'What is jobsite-intel adapter?', a: 'Production adapter with 200 construction Q&A pairs.', tags: ['demo'] },
  { q: 'Can I customize actions?', a: 'Pass your own SorenConfig with up to four action cards.', tags: ['demo'] },
  { q: 'What is the cream background?', a: '#FBF8F1 — cream token from the mockup.', tags: ['demo'] },
  { q: 'Who built Soren screen?', a: 'Varshyl Inc. — shared toolkit package for all products.', tags: ['demo'] },
  { q: 'How do I publish?', a: 'Tag release soren-screen-v0.1.0 after merge to main.', tags: ['demo'] },
];
