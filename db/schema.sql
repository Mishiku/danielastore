CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image TEXT NOT NULL,
  color VARCHAR(20) NOT NULL,
  badge VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'admin'))
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  phone VARCHAR(30) NOT NULL,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  products JSONB NOT NULL CHECK (jsonb_typeof(products) = 'array')
);
