import { dbGet } from '../../database/connection';
import type { UserRecord } from './auth.types';

export function findUserByEmail(email: string) {
  return dbGet<UserRecord>('SELECT id, email, password_hash, role FROM users WHERE email = ?', [email]);
}
