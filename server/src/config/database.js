import pg from 'pg';
import dotenv from 'dotenv';
import { runMigrations } from '../database/migrate.js';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_9Ed3cSMROfoU@ep-silent-rice-aeva84a3-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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
