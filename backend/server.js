const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const port = Number(process.env.PORT || 3000);
const tokenSecret = process.env.AUTH_SECRET;
const dbPath = process.env.SQLITE_DB_PATH || '/data/danielastore.db';
const schemaPath = process.env.SQLITE_SCHEMA_PATH || '/app/db/schema.sql';

if (!tokenSecret) {
  throw new Error('AUTH_SECRET must be provided through the environment');
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (error) => {
  if (error) {
    console.error('Unable to open SQLite database', error);
    throw error;
  }
});

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

function dbExec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
      } else {
        resolve(row);
      }
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows || []);
      }
    });
  });
}

async function initializeDatabase() {
  const defaultSchema = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      image TEXT NOT NULL,
      color TEXT NOT NULL,
      badge TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      phone TEXT NOT NULL,
      ordered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      products TEXT NOT NULL CHECK (json_valid(products))
    );
  `;

  const schemaSql = fs.existsSync(schemaPath)
    ? fs.readFileSync(schemaPath, 'utf8')
    : defaultSchema;

  await dbExec(schemaSql);
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
    await dbGet('SELECT 1 AS ok');
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Database health check failed', error);
    res.status(503).json({ status: 'unavailable' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const rows = await dbAll(
      'SELECT id, name, category, CAST(price AS REAL) AS price, image, color, badge FROM products ORDER BY id'
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
    const user = await dbGet(
      'SELECT id, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

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
    const insertResult = await dbRun(
      `INSERT INTO products (name, category, price, image, color, badge)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category, price, image, color, badge]
    );

    const product = await dbGet(
      'SELECT id, name, category, CAST(price AS REAL) AS price, image, color, badge FROM products WHERE id = ?',
      [insertResult.id]
    );

    res.status(201).json(product);
  } catch (error) {
    console.error('Unable to create product', error);
    res.status(500).json({ error: 'Unable to create product' });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const productIds = Array.isArray(req.body.products) ? req.body.products : [];

  if (!phone || !/^[0-9+() .-]{7,20}$/.test(phone) ||
      productIds.length === 0 ||
      productIds.some((id) => !Number.isInteger(id) || id <= 0) ||
      new Set(productIds).size !== productIds.length) {
    return res.status(400).json({ error: 'A valid phone number and at least one product are required' });
  }

  try {
    const placeholders = productIds.map(() => '?').join(',');
    const products = await dbAll(
      `SELECT id, name, CAST(price AS REAL) AS price FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more selected products are unavailable' });
    }

    const result = await dbRun(
      'INSERT INTO orders (user_id, phone, products) VALUES (?, ?, ?)',
      [req.user.id, phone, JSON.stringify(products)]
    );

    const order = await dbGet('SELECT id, ordered_at FROM orders WHERE id = ?', [result.id]);
    res.status(201).json(order);
  } catch (error) {
    console.error('Unable to create order', error);
    res.status(500).json({ error: 'Unable to create order' });
  }
});

app.delete('/api/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Unable to delete product', error);
    res.status(500).json({ error: 'Unable to delete product' });
  }
});

initializeDatabase()
  .then(async () => {
    await seedDatabaseIfEmpty();
    app.listen(port, () => {
      console.log(`Product API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to initialize SQLite database', error);
    process.exit(1);
  });
