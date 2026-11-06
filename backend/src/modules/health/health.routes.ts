import { Router } from 'express';
import { dbGet } from '../../database/connection';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await dbGet('SELECT 1 AS ok');
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Database health check failed', error);
    res.status(503).json({ status: 'unavailable' });
  }
});
