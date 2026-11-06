import crypto from 'crypto';
import { env } from '../../config/env';
import type { AuthUser, UserRecord } from './auth.types';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function sign(payload: string): string {
  return crypto.createHmac('sha256', env.authSecret).update(payload).digest('base64url');
}

export function createToken(user: Pick<UserRecord, 'id' | 'email' | 'role'>): string {
  const data: AuthUser = { id: user.id, email: user.email, role: user.role, exp: Date.now() + TOKEN_TTL_MS };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export type TokenResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: 'Invalid token' | 'Expired token' };

export function verifyToken(token: string): TokenResult {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return { ok: false, error: 'Invalid token' };

  const expected = sign(payload);
  if (signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return { ok: false, error: 'Invalid token' };
  }

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AuthUser;
    if (!user.id || !user.role || user.exp < Date.now()) return { ok: false, error: 'Expired token' };
    return { ok: true, user };
  } catch {
    return { ok: false, error: 'Invalid token' };
  }
}
