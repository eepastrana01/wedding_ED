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

// Reintento transparente ante bloqueos transitorios de concurrencia en PostgreSQL (40P01 / 40001)
const rawPoolQuery = pool.query.bind(pool);
pool.query = async (...args) => {
  // Si se pasa un callback estilo antiguo, delegar directo
  if (typeof args[args.length - 1] === 'function') {
    return rawPoolQuery(...args);
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await rawPoolQuery(...args);
    } catch (err) {
      const isRetryableConcurrencyError =
        err && (err.code === '40P01' || err.code === '40001');
      if (!isRetryableConcurrencyError || attempt === maxAttempts) {
        throw err;
      }
      const backoffMs = 100 * attempt + Math.floor(Math.random() * 90);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
};

export async function initDatabase() {
  await runMigrations();
}

export default pool;
