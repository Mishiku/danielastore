import type { Request, Response } from 'express';
import { verifyPassword } from '../../utils/password';
import { findUserByEmail } from './auth.repository';
import { createToken } from './token';

export async function login(req: Request, res: Response) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const user = await findUserByEmail(email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      token: createToken(user),
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Unable to authenticate user', error);
    res.status(500).json({ error: 'Unable to authenticate user' });
  }
}
