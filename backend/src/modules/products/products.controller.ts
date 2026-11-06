import type { Request, Response } from 'express';
import {
  deleteProductById,
  findAllProducts,
  findProductById,
  insertProduct
} from './products.repository';

const MAX_IMAGE_LENGTH = 8 * 1024 * 1024;

export async function listProducts(_req: Request, res: Response) {
  try {
    res.json(await findAllProducts());
  } catch (error) {
    console.error('Unable to read products', error);
    res.status(500).json({ error: 'Unable to read products' });
  }
}

export async function createProduct(req: Request, res: Response) {
  const { name, category, price, image, color, badge = null } = req.body;

  if (!name || !category || price === undefined || !image || !color) {
    return res.status(400).json({
      error: 'name, category, price, image, and color are required'
    });
  }

  if (typeof image !== 'string' ||
      (image.length > MAX_IMAGE_LENGTH && image.startsWith('data:image/'))) {
    return res.status(400).json({ error: 'Image data is too large' });
  }

  try {
    const id = await insertProduct({ name, category, price, image, color, badge });
    res.status(201).json(await findProductById(id));
  } catch (error) {
    console.error('Unable to create product', error);
    res.status(500).json({ error: 'Unable to create product' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const deleted = await deleteProductById(String(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (error) {
    console.error('Unable to delete product', error);
    res.status(500).json({ error: 'Unable to delete product' });
  }
}
