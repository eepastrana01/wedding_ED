import pg from 'pg';
import dotenv from 'dotenv';
import { runMigrations } from '../database/migrate.js';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('ADVERTENCIA: La variable de entorno DATABASE_URL no está definida.');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function initDatabase() {
  await runMigrations();
}

export default pool;
