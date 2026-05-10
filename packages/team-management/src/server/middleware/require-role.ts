import type { Request, Response, NextFunction } from 'express';
import type { OrgRole } from '../types.js';
import { roleAtLeast } from '../types.js';
import type { AuthenticatedRequest } from './require-membership.js';

export function requireRole(minimumRole: OrgRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roleAtLeast(authReq.userRole, minimumRole)) {
      res.status(403).json({ error: `Requires ${minimumRole} role or higher` });
      return;
    }
    next();
  };
}
