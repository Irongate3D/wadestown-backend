import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';

if (process.env.RUN_MIGRATIONS === 'true') {
  runMigrations(config)
    .then(() => bootstrap(config))
    .catch(err => {
      console.error('Migration failed:', err);
    });
} else {
  bootstrap(config).catch(err => {
    console.error('Bootstrap failed:', err);
  });
}