import { dbAll, dbGet, dbRun } from '../../database/connection';
import type { NewProduct, Product } from './products.types';

const PRODUCT_COLUMNS = 'id, name, category, CAST(price AS REAL) AS price, image, color, badge';

export function findAllProducts() {
  return dbAll<Product>(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY id`);
}

export function findProductById(id: number) {
  return dbGet<Product>(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`, [id]);
}

export function findProductSummariesByIds(ids: number[]) {
  const placeholders = ids.map(() => '?').join(',');
  return dbAll<Pick<Product, 'id' | 'name' | 'price'>>(
    `SELECT id, name, CAST(price AS REAL) AS price FROM products WHERE id IN (${placeholders})`,
    ids
  );
}

export async function insertProduct(p: NewProduct) {
  const result = await dbRun(
    'INSERT INTO products (name, category, price, image, color, badge) VALUES (?, ?, ?, ?, ?, ?)',
    [p.name, p.category, p.price, p.image, p.color, p.badge]
  );
  return result.id;
}

export async function deleteProductById(id: string | number) {
  const result = await dbRun('DELETE FROM products WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function countProducts() {
  const row = await dbGet<{ count: number }>('SELECT COUNT(*) AS count FROM products');
  return row?.count ?? 0;
}
