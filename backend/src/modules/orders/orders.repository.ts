import { dbGet, dbRun } from '../../database/connection';

export async function insertOrder(userId: number, phone: string, products: unknown) {
  const result = await dbRun(
    'INSERT INTO orders (user_id, phone, products) VALUES (?, ?, ?)',
    [userId, phone, JSON.stringify(products)]
  );
  return result.id;
}

export function findOrderById(id: number) {
  return dbGet<{ id: number; ordered_at: string }>('SELECT id, ordered_at FROM orders WHERE id = ?', [id]);
}
