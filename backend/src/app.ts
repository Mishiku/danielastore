import cors from 'cors';
import express from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { healthRouter } from './modules/health/health.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { productsRouter } from './modules/products/products.routes';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
