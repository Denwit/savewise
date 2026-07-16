import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env'), override: false });

const dialect = process.env.DB_DIALECT || 'postgres';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasExplicitHost = Boolean(process.env.DB_HOST);

if (process.env.NODE_ENV === 'production' && !hasDatabaseUrl && !hasExplicitHost) {
  throw new Error('Production database configuration is missing. Set DATABASE_URL from your Render Postgres Internal Database URL, or set DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD.');
}

const commonOptions = {
  dialect,
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

if (dialect === 'postgres') {
  commonOptions.dialectOptions = {
    ssl: process.env.DB_SSL === 'true'
      ? { require: true, rejectUnauthorized: false }
      : false
  };
}

const sequelize = hasDatabaseUrl
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(
      process.env.DB_NAME || 'savewise',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        ...commonOptions,
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432)
      }
    );

export default sequelize;
