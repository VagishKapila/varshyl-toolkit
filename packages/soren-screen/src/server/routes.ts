import { Router, type Request, type Response } from 'express';
import type { SorenQAPair, SorenServerConfig } from '../types.js';
import {
  buildPortfolioPdf,
  fetchPortfolioData,
  toPdfApiResponse,
  toSorenPortfolioData,
} from './portfolio-builder.js';
import { createQAEngine, getQAPairsForProduct } from './qa-engine.js';

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

  const engines = new Map<string, ReturnType<typeof createQAEngine>>();

  const getEngine = (productId: string) => {
    let engine = engines.get(productId);
    if (!engine) {
      engine = createQAEngine({
        qaRegistry: registry,
        productId,
        pool: options.pool,
        openaiApiKey: options.openaiApiKey,
      });
      engines.set(productId, engine);
    }
    return engine;
  };

  router.get('/qa', async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const product = typeof req.query.product === 'string' ? req.query.product : options.productId;
      if (!getQAPairsForProduct(product, registry).length && !options.pool) {
        res.json({ answer: '', confidence: 0, outOfScope: true });
        return;
      }
      const result = await getEngine(product).search(q);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Q&A search failed',
      });
    }
  });

  router.get('/portfolio/:userId', async (req: Request, res: Response) => {
    try {
      const data = await fetchPortfolioData(req.params.userId, options.portfolio?.dataSource);
      res.json(toSorenPortfolioData(data));
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Portfolio fetch failed',
      });
    }
  });

  router.post('/portfolio/:userId/pdf', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      let data = await fetchPortfolioData(userId, options.portfolio?.dataSource);
      if (typeof req.body?.firstName === 'string') {
        data = { ...data, firstName: req.body.firstName };
      }
      if (typeof req.body?.lastName === 'string') {
        data = { ...data, lastName: req.body.lastName };
      }
      if (typeof req.body?.displayName === 'string' && !req.body?.firstName) {
        const parts = req.body.displayName.trim().split(/\s+/);
        data = { ...data, firstName: parts[0] ?? data.firstName, lastName: parts.slice(1).join(' ') };
      }
      const result = await buildPortfolioPdf(data, {
        anthropicApiKey: options.anthropicApiKey,
        portfolio: options.portfolio,
      });
      res.json(toPdfApiResponse(result));
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'PDF generation failed',
      });
    }
  });

  return router;
}
