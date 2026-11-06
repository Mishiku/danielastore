import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { createProduct, deleteProduct, listProducts } from './products.controller';

export const productsRouter = Router();

productsRouter.get('/', listProducts);
productsRouter.post('/', authenticate, requireAdmin, createProduct);
productsRouter.delete('/:id', authenticate, requireAdmin, deleteProduct);
