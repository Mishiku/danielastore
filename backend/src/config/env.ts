const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error('AUTH_SECRET must be provided through the environment');
}

export const env = {
  port: Number(process.env.PORT || 3000),
  authSecret,
  dbPath: process.env.SQLITE_DB_PATH || '/data/danielastore.db',
  schemaPath: process.env.SQLITE_SCHEMA_PATH || '/app/db/schema.sql'
};
