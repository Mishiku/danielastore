const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new Pool();
const tokenSecret = process.env.AUTH_SECRET;

if (!tokenSecret) {
  throw new Error('AUTH_SECRET must be provided through the environment');
}

app.use(cors());
app.use(express.json({ limit: '8mb' }));

function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) return false;
  const hash = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hash, Buffer.from(storedHash, 'hex'));
}

function createToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 8 * 60 * 60 * 1000
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return res.status(401).json({ error: 'Invalid token' });

  const expectedSignature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  if (signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!user.id || !user.role || user.exp < Date.now()) {
      return res.status(401).json({ error: 'Expired token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Database health check failed', error);
    res.status(503).json({ status: 'unavailable' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, category, price::float AS price, image, color, badge FROM products ORDER BY id'
    );
    res.json(rows);
  } catch (error) {
    console.error('Unable to read products', error);
    res.status(500).json({ error: 'Unable to read products' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
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
});

app.post('/api/products', authenticate, requireAdmin, async (req, res) => {
  const { name, category, price, image, color, badge = null } = req.body;

  if (!name || !category || price === undefined || !image || !color) {
    return res.status(400).json({
      error: 'name, category, price, image, and color are required'
    });

  }
  if (typeof image !== 'string' ||
      (image.length > 8 * 1024 * 1024 && image.startsWith('data:image/'))) {
    return res.status(400).json({ error: 'Image data is too large' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO products (name, category, price, image, color, badge)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, category, price::float AS price, image, color, badge`,
      [name, category, price, image, color, badge]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Unable to create product', error);
    res.status(500).json({ error: 'Unable to create product' });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const productIds = req.body.products;
  if (!phone || !/^[0-9+() .-]{7,20}$/.test(phone) ||
      !Array.isArray(productIds) || productIds.length === 0 ||
      productIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    return res.status(400).json({ error: 'A valid phone number and at least one product are required' });
  }

  try {
    const { rows: products } = await pool.query(
      'SELECT id, name, price::float AS price FROM products WHERE id = ANY($1::int[])',
      [productIds]
    );
    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more selected products are unavailable' });
    }
    const { rows } = await pool.query(
      `INSERT INTO orders (user_id, phone, products)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, ordered_at`,
      [req.user.id, phone, JSON.stringify(products)]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Unable to create order', error);
    res.status(500).json({ error: 'Unable to create order' });
  }
});

app.delete('/api/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Unable to delete product', error);
    res.status(500).json({ error: 'Unable to delete product' });
  }
});

app.listen(port, () => {
  console.log(`Product API listening on port ${port}`);
});
