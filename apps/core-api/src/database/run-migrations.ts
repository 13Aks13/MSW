import { AppDataSource } from './data-source.js';

const dataSource = await AppDataSource.initialize();
try {
  const migrations = await dataSource.runMigrations({ transaction: 'each' });
  if (migrations.length === 0) {
    console.log('No pending migrations.');
  } else {
    for (const migration of migrations) {
      console.log(`Applied migration: ${migration.name}`);
    }
  }
} finally {
  await dataSource.destroy();
}
