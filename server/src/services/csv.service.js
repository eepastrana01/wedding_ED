import pool from '../config/database.js';

export const csvService = {
  normalizeHeader(header) {
    if (!header) return '';
    return header
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  },

  async importGuestsFromRows(rows, options = {}) {
    const { autoCreateFamilies = false, defaultPriority = 'A' } = options;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const importedGuests = [];
      let familiesCreatedCount = 0;

      for (const row of rows) {
        // Map keys flexibly
        let name = '';
        let partnerName = '';
        let type = 'Adulto';
        let groupRelation = 'General';
        let guestType = 'Titular';
        let priority = defaultPriority;
        let phone = '';
        let notes = '';
        let side = null;

        for (const [key, value] of Object.entries(row)) {
          const normKey = this.normalizeHeader(key);
          const val = (value !== null && value !== undefined) ? String(value).trim() : '';

          if (normKey === 'nombre' || normKey === 'name') {
            name = val;
          } else if (normKey === 'pareja' || normKey === 'partner' || normKey === 'parejanombre') {
            if (['novio', 'novia', 'comun', 'común', 'ambos'].includes(val.toLowerCase())) {
              side = val;
            } else {
              partnerName = val;
            }
          } else if (normKey === 'type' || normKey === 'tipo' || normKey === 'categoriainvitado') {
            type = val || 'Adulto';
          } else if (normKey === 'gruporelacion' || normKey === 'grupo' || normKey === 'relacion' || normKey === 'lado') {
            groupRelation = val || 'General';
          } else if (normKey === 'tipoinvitado' || normKey === 'tipodeinvitado' || normKey === 'rol') {
            guestType = val || 'Titular';
          } else if (normKey === 'prioridad' || normKey === 'priority') {
            priority = val || defaultPriority;
          } else if (normKey === 'telefono' || normKey === 'phone' || normKey === 'celular') {
            phone = val;
          } else if (normKey === 'notas' || normKey === 'notes' || normKey === 'comentarios') {
            notes = val;
          } else if (normKey === 'lado' || normKey === 'afinidad') {
            side = val;
          }
        }

        // If no name found, try the first column
        if (!name && Object.values(row).length > 0) {
          name = String(Object.values(row)[0] || '').trim();
        }

        if (!name) {
          // Skip empty row
          continue;
        }

        let familyId = null;

        // Auto create family if requested
        if (autoCreateFamilies) {
          let famName = null;
          const typeStr = (type || '').trim();
          if (typeStr && !['individual', 'adulto', 'niño', 'nino', 'general'].includes(typeStr.toLowerCase())) {
            famName = typeStr
              .replace(/^Fanilia/i, 'Familia')
              .replace(/^Famia/i, 'Familia')
              .trim();
          } else if (partnerName && !['novio', 'novia', 'comun', 'general'].includes(partnerName.trim().toLowerCase())) {
            famName = `Familia ${name.split(' ')[0]} y ${partnerName.split(' ')[0]}`;
          }

          if (famName) {
            const existingFam = await client.query(`SELECT id FROM families WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))`, [famName]);
            if (existingFam.rows.length > 0) {
              familyId = existingFam.rows[0].id;
            } else {
              const insertFamQuery = `
                INSERT INTO families (name, notes) 
                VALUES ($1, $2) 
                RETURNING id
              `;
              const famRes = await client.query(insertFamQuery, [famName, `Creada automáticamente desde CSV`]);
              familyId = famRes.rows[0].id;
              familiesCreatedCount++;
            }
          }
        }

        const insertGuestQuery = `
          INSERT INTO guests (
            family_id, name, partner_name, type, group_relation, 
            guest_type, priority, status, confirmed_seats, notes, phone, side, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 1, $8, $9, $10, CURRENT_TIMESTAMP)
          RETURNING *
        `;
        const guestRes = await client.query(insertGuestQuery, [
          familyId,
          name,
          partnerName || null,
          type || 'Adulto',
          groupRelation || null,
          guestType || 'Titular',
          priority || 'A',
          notes || null,
          phone || null,
          side || null
        ]);

        importedGuests.push(guestRes.rows[0]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        count: importedGuests.length,
        familiesCreated: familiesCreatedCount,
        guests: importedGuests
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};
