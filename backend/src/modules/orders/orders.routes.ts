import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createOrder } from './orders.controller';

export const ordersRouter = Router();

ordersRouter.post('/', authenticate, createOrder);
