import fs from 'fs';
import path from 'path';
import pool from './server/src/config/database.js';

async function performFullBackup() {
  console.log('📦 Iniciando respaldo de seguridad completo de la boda...');

  const backupDir = path.resolve('d:/BodaED/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  try {
    // 1. Respaldo de Familias
    const famRes = await pool.query('SELECT * FROM families ORDER BY id ASC');
    console.log(`✅ Familias encontradas: ${famRes.rows.length}`);

    // 2. Respaldo de Invitados
    const guestRes = await pool.query('SELECT * FROM guests ORDER BY id ASC');
    console.log(`✅ Invitados encontrados: ${guestRes.rows.length}`);

    // 3. Respaldo de Tareas
    let tasksRes = { rows: [] };
    try {
      tasksRes = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
      console.log(`✅ Tareas encontradas: ${tasksRes.rows.length}`);
    } catch (e) {
      console.log('ℹ️ Tabla tasks no disponible o vacía');
    }

    // 4. Respaldo de Fotos
    let photosRes = { rows: [] };
    try {
      photosRes = await pool.query('SELECT * FROM photos ORDER BY id ASC');
      console.log(`✅ Fotos encontradas: ${photosRes.rows.length}`);
    } catch (e) {
      console.log('ℹ️ Tabla photos no disponible o vacía');
    }

    const fullData = {
      backup_date: new Date().toISOString(),
      total_guests: guestRes.rows.length,
      total_families: famRes.rows.length,
      total_tasks: tasksRes.rows.length,
      total_photos: photosRes.rows.length,
      families: famRes.rows,
      guests: guestRes.rows,
      tasks: tasksRes.rows,
      photos: photosRes.rows,
    };

    // Guardar en JSON fechado y en json maestro
    const jsonPath = path.join(backupDir, `respaldo_boda_${timestamp}.json`);
    const masterJsonPath = path.join(backupDir, 'respaldo_boda_latest.json');
    fs.writeFileSync(jsonPath, JSON.stringify(fullData, null, 2), 'utf-8');
    fs.writeFileSync(masterJsonPath, JSON.stringify(fullData, null, 2), 'utf-8');
    console.log(`💾 Respaldo JSON guardado en: ${jsonPath}`);

    // Guardar en CSV para abrir en Excel
    if (guestRes.rows.length > 0) {
      const keys = Object.keys(guestRes.rows[0]);
      const csvLines = [
        keys.join(','),
        ...guestRes.rows.map((row) =>
          keys
            .map((k) => {
              const val = row[k];
              if (val === null || val === undefined) return '""';
              return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ];
      const csvPath = path.join(backupDir, `invitados_boda_${timestamp}.csv`);
      const masterCsvPath = path.join(backupDir, 'invitados_boda_latest.csv');
      fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
      fs.writeFileSync(masterCsvPath, csvLines.join('\n'), 'utf-8');
      console.log(`📊 Respaldo CSV guardado en: ${csvPath}`);
    }

    // Generar script SQL reproducible para restaurar en cualquier otra base de datos
    let sqlContent = `-- Respaldo generado automáticamente el ${new Date().toISOString()}\n`;
    sqlContent += `CREATE EXTENSION IF NOT EXISTS unaccent;\n\n`;

    // Familias SQL
    if (famRes.rows.length > 0) {
      sqlContent += `-- INSERTS DE FAMILIAS\n`;
      for (const f of famRes.rows) {
        const id = f.id;
        const name = f.name ? `'${f.name.replace(/'/g, "''")}'` : 'NULL';
        const notes = f.notes ? `'${f.notes.replace(/'/g, "''")}'` : 'NULL';
        const phone = f.phone ? `'${f.phone.replace(/'/g, "''")}'` : 'NULL';
        const delivered = f.invitation_delivered ? 'TRUE' : 'FALSE';
        sqlContent += `INSERT INTO families (id, name, notes, phone, invitation_delivered) VALUES (${id}, ${name}, ${notes}, ${phone}, ${delivered}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, notes = EXCLUDED.notes, phone = EXCLUDED.phone, invitation_delivered = EXCLUDED.invitation_delivered;\n`;
      }
      sqlContent += `SELECT setval('families_id_seq', (SELECT MAX(id) FROM families));\n\n`;
    }

    // Invitados SQL
    if (guestRes.rows.length > 0) {
      sqlContent += `-- INSERTS DE INVITADOS\n`;
      for (const g of guestRes.rows) {
        const id = g.id;
        const family_id = g.family_id ? g.family_id : 'NULL';
        const name = g.name ? `'${g.name.replace(/'/g, "''")}'` : 'NULL';
        const partner_name = g.partner_name ? `'${g.partner_name.replace(/'/g, "''")}'` : 'NULL';
        const type = g.type ? `'${g.type.replace(/'/g, "''")}'` : "'Adulto'";
        const group_relation = g.group_relation ? `'${g.group_relation.replace(/'/g, "''")}'` : 'NULL';
        const guest_type = g.guest_type ? `'${g.guest_type.replace(/'/g, "''")}'` : "'Titular'";
        const priority = g.priority ? `'${g.priority.replace(/'/g, "''")}'` : "'A'";
        const status = g.status ? `'${g.status.replace(/'/g, "''")}'` : "'pending'";
        const confirmed_seats = g.confirmed_seats || 1;
        const dietary_notes = g.dietary_notes ? `'${g.dietary_notes.replace(/'/g, "''")}'` : 'NULL';
        const notes = g.notes ? `'${g.notes.replace(/'/g, "''")}'` : 'NULL';
        const phone = g.phone ? `'${g.phone.replace(/'/g, "''")}'` : 'NULL';
        const delivered = g.invitation_delivered ? 'TRUE' : 'FALSE';

        sqlContent += `INSERT INTO guests (id, family_id, name, partner_name, type, group_relation, guest_type, priority, status, confirmed_seats, dietary_notes, notes, phone, invitation_delivered) VALUES (${id}, ${family_id}, ${name}, ${partner_name}, ${type}, ${group_relation}, ${guest_type}, ${priority}, ${status}, ${confirmed_seats}, ${dietary_notes}, ${notes}, ${phone}, ${delivered}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, partner_name = EXCLUDED.partner_name, family_id = EXCLUDED.family_id, group_relation = EXCLUDED.group_relation, guest_type = EXCLUDED.guest_type, priority = EXCLUDED.priority, status = EXCLUDED.status, confirmed_seats = EXCLUDED.confirmed_seats, dietary_notes = EXCLUDED.dietary_notes, notes = EXCLUDED.notes, phone = EXCLUDED.phone, invitation_delivered = EXCLUDED.invitation_delivered;\n`;
      }
      sqlContent += `SELECT setval('guests_id_seq', (SELECT MAX(id) FROM guests));\n\n`;
    }

    const sqlPath = path.join(backupDir, `restaurar_boda_${timestamp}.sql`);
    const masterSqlPath = path.join(backupDir, 'restaurar_boda_latest.sql');
    fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
    fs.writeFileSync(masterSqlPath, sqlContent, 'utf-8');
    console.log(`📜 Script SQL de restauración guardado en: ${sqlPath}`);

    console.log('🎉 ¡RESPALDO COMPLETADO CON ÉXITO ABSOLUTO!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error durante el respaldo:', err.message);
    process.exit(1);
  }
}

performFullBackup();
