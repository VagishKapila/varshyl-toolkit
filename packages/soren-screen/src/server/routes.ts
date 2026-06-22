import { Router, type Request, type Response } from 'express';
import type { SorenQAPair, SorenServerConfig } from '../types.js';
import { buildPortfolioPdf, fetchPortfolioData } from './portfolio-builder.js';
import { getQAPairsForProduct, searchQAPairs } from './qa-engine.js';

export interface CreateSorenRouterOptions extends SorenServerConfig {
  /** Map productId → Q&A pairs (e.g. jobsite, reference). */
  qaRegistry?: Record<string, SorenQAPair[]>;
}

export function createSorenRouter(options: CreateSorenRouterOptions): Router {
  const router = Router();
  const registry = options.qaRegistry ?? {};

  if (options.qaPairs) {
    registry[options.productId] = options.qaPairs;
  }

  router.get('/qa', (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const product = typeof req.query.product === 'string' ? req.query.product : options.productId;
    const pairs = getQAPairsForProduct(product, registry);
    const result = searchQAPairs(q, pairs);
    res.json(result);
  });

  router.get('/portfolio/:userId', async (req: Request, res: Response) => {
    try {
      const data = await fetchPortfolioData(req.params.userId, options.portfolio?.dataSource);
      res.json(data);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Portfolio fetch failed',
      });
    }
  });

  router.post('/portfolio/:userId/pdf', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName : 'Professional';
      const data = await fetchPortfolioData(userId, options.portfolio?.dataSource);
      const result = await buildPortfolioPdf(userId, displayName, data, {
        anthropicApiKey: options.anthropicApiKey,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'PDF generation failed',
      });
    }
  });

  return router;
}
