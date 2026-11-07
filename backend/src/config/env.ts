const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error('AUTH_SECRET must be provided through the environment');
}

export const env = {
  port: Number(process.env.PORT || 3000),
  authSecret,
  dbPath: process.env.SQLITE_DB_PATH || '/data/danielastore.db',
  schemaPath: process.env.SQLITE_SCHEMA_PATH || '/app/db/schema.sql',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@danielastore.local'
  }
};
