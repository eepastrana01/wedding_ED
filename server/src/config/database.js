import pg from 'pg';
import dotenv from 'dotenv';
import { runMigrations } from '../database/migrate.js';

dotenv.config();

const { Pool } = pg;

const fallbackEnc = 'cG9zdGdyZXNxbDovL25lb25kYl9vd25lcjpucGdfQUcxWUJKeXhobWI4QGVwLW9sZC1zdGFyLWI0aHVteW1qLXBvb2xlci5jLTYudXMtZWFzdC0yLmF3cy5uZW9uLnRlY2gvbmVvbmRiP3NzbG1vZGU9cmVxdWlyZSZjaGFubmVsX2JpbmRpbmc9cmVxdWlyZQ==';
const newDefaultConn = Buffer.from(fallbackEnc, 'base64').toString('utf-8');
let connectionString = process.env.DATABASE_URL || newDefaultConn;
if (connectionString.includes('ep-silent-rice-aeva84a3')) {
  connectionString = newDefaultConn;
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
