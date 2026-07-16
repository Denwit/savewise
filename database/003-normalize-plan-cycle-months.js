const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

function monthsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const wholeMonths = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  const anchor = new Date(start);
  anchor.setUTCMonth(anchor.getUTCMonth() + wholeMonths);
  const months = Math.max(wholeMonths + (anchor < end ? 1 : 0), 1);
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}

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
  const { rows } = await pool.query('SELECT id, start_date, end_date FROM saving_plans');
  for (const row of rows) {
    await pool.query('UPDATE saving_plans SET cycle = $1 WHERE id = $2', [monthsBetween(row.start_date, row.end_date), row.id]);
  }

  const updated = await pool.query('SELECT id, plan_name, cycle, start_date, end_date FROM saving_plans ORDER BY id');
  console.table(updated.rows);
  await pool.end();
})().catch(async (error) => {
  await pool.end().catch(() => {});
  console.error(error.message);
  process.exit(1);
});
