import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;

const newConnectionString = process.argv[2];

if (!newConnectionString) {
  console.error('❌ Debes proporcionar la nueva cadena de conexión:');
  console.error('   node restore_new_db.mjs "postgresql://user:pass@ep-...neon.tech/neondb?sslmode=require"');
  process.exit(1);
}

async function restoreDatabase() {
  console.log('🚀 Conectando a la nueva base de datos...');
  const pool = new Pool({
    connectionString: newConnectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log('🔄 1. Creando tablas y extensiones base...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        notes TEXT,
        phone VARCHAR(50),
        invitation_delivered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        partner_name VARCHAR(255),
        type VARCHAR(50) DEFAULT 'Adulto',
        group_relation VARCHAR(100),
        guest_type VARCHAR(50) DEFAULT 'Titular',
        priority VARCHAR(20) DEFAULT 'A',
        status VARCHAR(20) DEFAULT 'pending',
        confirmed_seats INTEGER DEFAULT 1,
        dietary_notes TEXT,
        notes TEXT,
        phone VARCHAR(50),
        table_assigned VARCHAR(50),
        invitation_delivered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'general',
        assigned_to VARCHAR(100) DEFAULT 'Juntos',
        priority VARCHAR(20) DEFAULT 'media',
        status VARCHAR(20) DEFAULT 'pending',
        due_date DATE,
        estimated_cost NUMERIC(10, 2) DEFAULT 0,
        actual_cost NUMERIC(10, 2) DEFAULT 0,
        subtasks JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        public_id VARCHAR(255),
        uploader_name VARCHAR(100) DEFAULT 'Invitado',
        uploader_animal VARCHAR(50),
        status VARCHAR(20) DEFAULT 'approved',
        caption TEXT,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('📥 2. Leyendo script SQL de respaldo...');
    const sqlPath = path.resolve('d:/BodaED/backups/restaurar_boda_latest.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo SQL en: ${sqlPath}`);
    }
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    console.log('⚡ 3. Insertando todos los datos respaldados...');
    await client.query(sqlScript);

    // Si hay tareas o fotos en el JSON de respaldo, restaurarlas también
    const jsonPath = path.resolve('d:/BodaED/backups/respaldo_boda_latest.json');
    if (fs.existsSync(jsonPath)) {
      const fullData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      if (Array.isArray(fullData.tasks) && fullData.tasks.length > 0) {
        console.log(`📋 Insertando ${fullData.tasks.length} tareas...`);
        for (const t of fullData.tasks) {
          await client.query(`
            INSERT INTO tasks (id, title, description, category, assigned_to, priority, status, due_date, estimated_cost, actual_cost, subtasks, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, status = EXCLUDED.status;
          `, [t.id, t.title, t.description, t.category, t.assigned_to, t.priority, t.status, t.due_date, t.estimated_cost, t.actual_cost, JSON.stringify(t.subtasks || []), t.notes]);
        }
        await client.query(`SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));`);
      }

      if (Array.isArray(fullData.photos) && fullData.photos.length > 0) {
        console.log(`📸 Insertando ${fullData.photos.length} fotos...`);
        for (const p of fullData.photos) {
          await client.query(`
            INSERT INTO photos (id, url, thumbnail_url, public_id, uploader_name, uploader_animal, status, caption, likes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, status = EXCLUDED.status;
          `, [p.id, p.url, p.thumbnail_url, p.public_id, p.uploader_name, p.uploader_animal, p.status, p.caption, p.likes]);
        }
        await client.query(`SELECT setval('photos_id_seq', (SELECT MAX(id) FROM photos));`);
      }
    }

    // 4. Verificación final
    const guestsCount = await client.query('SELECT count(*) FROM guests');
    const familiesCount = await client.query('SELECT count(*) FROM families');
    const tasksCount = await client.query('SELECT count(*) FROM tasks');
    const photosCount = await client.query('SELECT count(*) FROM photos');

    console.log('\n=============================================');
    console.log('🎉 ¡RESTAURACIÓN EXITOSA EN LA NUEVA BASE DE DATOS!');
    console.log(`✅ Invitados restaurados: ${guestsCount.rows[0].count} / 120`);
    console.log(`✅ Familias restauradas: ${familiesCount.rows[0].count} / 36`);
    console.log(`✅ Tareas restauradas: ${tasksCount.rows[0].count} / 21`);
    console.log(`✅ Fotos restauradas: ${photosCount.rows[0].count} / 3`);
    console.log('=============================================\n');

    // 5. Actualizar server/.env localmente
    const envPath = path.resolve('d:/BodaED/server/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=${newConnectionString}`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('📝 Archivo server/.env actualizado con la nueva base de datos.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error durante la restauración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

restoreDatabase();
