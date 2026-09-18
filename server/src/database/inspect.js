import pool from '../config/database.js';

async function inspect() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'guests'
  `);
  console.log('Columns in guests:', res.rows);
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
