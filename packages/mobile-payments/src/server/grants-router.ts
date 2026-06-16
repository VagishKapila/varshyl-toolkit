import { Router, type Request, type Response } from 'express';
import type { Pool } from 'pg';
import {
  grantAccess,
  listGrants,
  listPromoCodes,
  createPromoCode,
  redeemPromoCode,
  revokeAccess,
} from './grants.js';

function productSlugFrom(req: Request): string | null {
  const fromQuery = req.query.productSlug;
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim();
  const body = req.body as { productSlug?: string } | undefined;
  if (body?.productSlug?.trim()) return body.productSlug.trim();
  return null;
}

function sendError(res: Response, status: number, error: string): void {
  res.status(status).json({ success: false, error });
}

export function grantsRouter(db: Pool): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const productSlug = productSlugFrom(req);
      if (!productSlug) return sendError(res, 400, 'productSlug required');
      const data = await listGrants(db, productSlug);
      res.json({ success: true, data });
    } catch {
      sendError(res, 500, 'Failed to list grants');
    }
  });

  router.post('/grant', async (req, res) => {
    try {
      const { userId, productSlug, grantedBy, reason, expiresAt } = req.body as {
        userId?: string;
        productSlug?: string;
        grantedBy?: string;
        reason?: string;
        expiresAt?: string | null;
      };
      if (!userId || !productSlug || !grantedBy) {
        return sendError(res, 400, 'userId, productSlug, and grantedBy required');
      }
      const data = await grantAccess(db, {
        userId,
        productSlug,
        grantedBy,
        reason: reason ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      res.json({ success: true, data });
    } catch {
      sendError(res, 500, 'Failed to grant access');
    }
  });

  router.post('/revoke', async (req, res) => {
    try {
      const { userId, productSlug } = req.body as { userId?: string; productSlug?: string };
      if (!userId || !productSlug) return sendError(res, 400, 'userId and productSlug required');
      const revoked = await revokeAccess(db, userId, productSlug);
      res.json({ success: true, data: { revoked } });
    } catch {
      sendError(res, 500, 'Failed to revoke access');
    }
  });

  router.get('/codes', async (req, res) => {
    try {
      const productSlug = productSlugFrom(req);
      if (!productSlug) return sendError(res, 400, 'productSlug required');
      const data = await listPromoCodes(db, productSlug);
      res.json({ success: true, data });
    } catch {
      sendError(res, 500, 'Failed to list promo codes');
    }
  });

  router.post('/codes/create', async (req, res) => {
    try {
      const body = req.body as {
        code?: string;
        productSlug?: string;
        createdBy?: string;
        maxUses?: number | null;
        expiresAt?: string | null;
        grantsPermanent?: boolean;
        grantsDays?: number | null;
      };
      if (!body.code || !body.productSlug || !body.createdBy) {
        return sendError(res, 400, 'code, productSlug, and createdBy required');
      }
      const data = await createPromoCode(db, {
        code: body.code,
        productSlug: body.productSlug,
        createdBy: body.createdBy,
        maxUses: body.maxUses ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        grantsPermanent: body.grantsPermanent,
        grantsDays: body.grantsDays ?? null,
      });
      res.json({ success: true, data });
    } catch {
      sendError(res, 500, 'Failed to create promo code');
    }
  });

  router.post('/codes/redeem', async (req, res) => {
    try {
      const { code, userId, productSlug } = req.body as {
        code?: string;
        userId?: string;
        productSlug?: string;
      };
      if (!code || !userId || !productSlug) {
        return sendError(res, 400, 'code, userId, and productSlug required');
      }
      const data = await redeemPromoCode(db, code, userId, productSlug);
      if (!data.success) return sendError(res, 400, data.reason ?? 'redeem_failed');
      res.json({ success: true, data });
    } catch {
      sendError(res, 500, 'Failed to redeem promo code');
    }
  });

  router.post('/codes/revoke', async (req, res) => {
    try {
      const { id, productSlug } = req.body as { id?: string; productSlug?: string };
      if (!id || !productSlug) return sendError(res, 400, 'id and productSlug required');
      const { rowCount } = await db.query(
        `UPDATE mp_promo_codes SET revoked_at = NOW()
         WHERE id = $1 AND product_slug = $2 AND revoked_at IS NULL`,
        [id, productSlug],
      );
      res.json({ success: true, data: { revoked: (rowCount ?? 0) > 0 } });
    } catch {
      sendError(res, 500, 'Failed to revoke promo code');
    }
  });

  return router;
}
