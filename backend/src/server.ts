import { app } from './app';
import { env } from './config/env';
import { initializeDatabase } from './database/initialize';

initializeDatabase()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Product API listening on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to initialize SQLite database', error);
    process.exit(1);
  });
