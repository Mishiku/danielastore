import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../modules/auth/token';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const result = verifyToken(token);
  if (!result.ok) return res.status(401).json({ error: result.error });

  req.user = result.user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
