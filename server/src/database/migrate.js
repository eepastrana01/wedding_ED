import pool from '../config/database.js';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Ejecutando migraciones seguras en Neon PostgreSQL...');

    // 1. Crear tabla families si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        notes TEXT,
        phone VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Crear tabla guests si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2b. Añadir columna invitation_delivered a families si no existe
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'families' AND column_name = 'invitation_delivered'
        ) THEN
          ALTER TABLE families ADD COLUMN invitation_delivered BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // 3. Añadir todas las columnas necesarias si no existen
    const columns = [
      { name: 'name', type: 'VARCHAR(255)' },
      { name: 'family_id', type: 'INTEGER REFERENCES families(id) ON DELETE SET NULL' },
      { name: 'partner_name', type: 'VARCHAR(255)' },
      { name: 'type', type: "VARCHAR(100) DEFAULT 'Adulto'" },
      { name: 'group_relation', type: 'VARCHAR(150)' },
      { name: 'guest_type', type: "VARCHAR(100) DEFAULT 'Titular'" },
      { name: 'priority', type: "VARCHAR(50) DEFAULT 'A'" },
      { name: 'status', type: "VARCHAR(50) DEFAULT 'pending'" },
      { name: 'confirmed_seats', type: 'INTEGER DEFAULT 1' },
      { name: 'dietary_notes', type: 'TEXT' },
      { name: 'notes', type: 'TEXT' },
      { name: 'phone', type: 'VARCHAR(50)' },
      { name: 'table_assigned', type: 'VARCHAR(100)' },
      { name: 'invitation_delivered', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'side', type: 'VARCHAR(50)' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
    ];

    for (const col of columns) {
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'guests' AND column_name = '${col.name}'
          ) THEN
            ALTER TABLE guests ADD COLUMN ${col.name} ${col.type};
          END IF;
        END $$;
      `);
    }

    // 3b. Sanitizar partner_name: Si contiene "Novio", "Novia", "Comun" guardar en "side" y vaciar partner_name
    await client.query(`
      UPDATE guests 
      SET side = partner_name 
      WHERE side IS NULL AND LOWER(TRIM(partner_name)) IN ('novio', 'novia', 'comun', 'común');

      UPDATE guests 
      SET partner_name = NULL 
      WHERE LOWER(TRIM(partner_name)) IN ('novio', 'novia', 'comun', 'común');
    `);

    // 4. Quitar restricciones NOT NULL en columnas heredadas si existen
    const legacyColumns = ['nombre', 'pareja', 'tipo', 'grupo_relacion', 'tipo_invitado', 'prioridad', 'invitation_id'];
    for (const legacyCol of legacyColumns) {
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'guests' AND column_name = '${legacyCol}'
          ) THEN
            ALTER TABLE guests ALTER COLUMN ${legacyCol} DROP NOT NULL;
          END IF;
        END $$;
      `);
    }

    // 5. Crear índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_guests_family_id ON guests(family_id);
      CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
      CREATE INDEX IF NOT EXISTS idx_guests_priority ON guests(priority);
      CREATE INDEX IF NOT EXISTS idx_guests_group_relation ON guests(group_relation);
    `);

    console.log('✅ Migraciones completadas exitosamente en Neon PostgreSQL.');
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  } finally {
    client.release();
  }
}
