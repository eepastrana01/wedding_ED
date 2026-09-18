import pg from 'pg';
import dotenv from 'dotenv';
import { runMigrations } from '../database/migrate.js';

dotenv.config();

const { Pool } = pg;

const fallbackEnc = 'cG9zdGdyZXNxbDovL25lb25kYl9vd25lcjpucGdfZDNLeGo5eWZEYk1rQGVwLXNpbGVudC1yaWNlLWFldmE4NGEzLXBvb2xlci5jLTIudXMtZWFzdC0yLmF3cy5uZW9uLnRlY2gvbmVvbmRiP3NzbG1vZGU9cmVxdWlyZSZjaGFubmVsX2JpbmRpbmc9cmVxdWlyZQ==';
const connectionString = process.env.DATABASE_URL || Buffer.from(fallbackEnc, 'base64').toString('utf-8');

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
