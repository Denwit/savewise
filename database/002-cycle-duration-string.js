const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'savewise',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

(async () => {
  await pool.query('ALTER TABLE saving_plans ALTER COLUMN cycle TYPE VARCHAR(50)');
  await pool.end();
  console.log('Updated saving_plans.cycle to VARCHAR(50)');
})().catch(async (error) => {
  await pool.end().catch(() => {});
  console.error(error.message);
  process.exit(1);
});
