import pool from '../config/database.js';

export const familyService = {
  async getAllFamilies(search = '') {
    let query = `
      SELECT 
        f.id,
        f.name,
        f.notes,
        f.phone,
        f.invitation_delivered,
        f.created_at,
        f.updated_at,
        COUNT(g.id)::int as total_members,
        COUNT(CASE WHEN g.status = 'confirmed' THEN 1 END)::int as confirmed_members,
        COUNT(CASE WHEN g.status = 'declined' THEN 1 END)::int as declined_members,
        COUNT(CASE WHEN g.status = 'pending' THEN 1 END)::int as pending_members,
        COALESCE(
          json_agg(
            json_build_object(
              'id', g.id,
              'name', g.name,
              'partner_name', g.partner_name,
              'type', g.type,
              'group_relation', g.group_relation,
              'guest_type', g.guest_type,
              'priority', g.priority,
              'status', g.status,
              'dietary_notes', g.dietary_notes,
              'phone', g.phone,
              'invitation_delivered', g.invitation_delivered
            ) ORDER BY g.id ASC
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) as members
      FROM families f
      LEFT JOIN guests g ON f.id = g.family_id
    `;
    const params = [];

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` WHERE LOWER(f.name) LIKE $1 OR LOWER(COALESCE(g.name, '')) LIKE $1`;
    }

    query += ` GROUP BY f.id ORDER BY f.name ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getFamilyById(id) {
    const query = `
      SELECT 
        f.id,
        f.name,
        f.notes,
        f.phone,
        f.invitation_delivered,
        f.created_at,
        f.updated_at,
        COUNT(g.id)::int as total_members,
        COUNT(CASE WHEN g.status = 'confirmed' THEN 1 END)::int as confirmed_members,
        COUNT(CASE WHEN g.status = 'declined' THEN 1 END)::int as declined_members,
        COUNT(CASE WHEN g.status = 'pending' THEN 1 END)::int as pending_members,
        COALESCE(
          json_agg(
            json_build_object(
              'id', g.id,
              'name', g.name,
              'partner_name', g.partner_name,
              'type', g.type,
              'group_relation', g.group_relation,
              'guest_type', g.guest_type,
              'priority', g.priority,
              'status', g.status,
              'dietary_notes', g.dietary_notes,
              'phone', g.phone,
              'invitation_delivered', g.invitation_delivered
            ) ORDER BY g.id ASC
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) as members
      FROM families f
      LEFT JOIN guests g ON f.id = g.family_id
      WHERE f.id = $1
      GROUP BY f.id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async createFamily(data) {
    const { name, notes, phone, member_ids = [] } = data;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const insertFamilyQuery = `
        INSERT INTO families (name, notes, phone)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const familyResult = await client.query(insertFamilyQuery, [name, notes || null, phone || null]);
      const newFamily = familyResult.rows[0];

      if (member_ids.length > 0) {
        const updateGuestsQuery = `
          UPDATE guests 
          SET family_id = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ANY($2::int[])
        `;
        await client.query(updateGuestsQuery, [newFamily.id, member_ids]);
      }

      await client.query('COMMIT');
      return await this.getFamilyById(newFamily.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateFamily(id, data) {
    const { name, notes, phone } = data;
    const query = `
      UPDATE families 
      SET 
        name = COALESCE($1, name),
        notes = $2,
        phone = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [name, notes !== undefined ? notes : null, phone !== undefined ? phone : null, id]);
    return result.rows[0];
  },

  async updateDeliveryStatus(id, delivered) {
    const query = `
      UPDATE families 
      SET invitation_delivered = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [Boolean(delivered), id]);
    return result.rows[0];
  },

  async bulkUpdateFamilyStatus(familyId, status) {
    const query = `
      UPDATE guests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE family_id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [status, familyId]);
    return result.rows;
  },

  async assignMembers(familyId, guestIds) {
    if (!guestIds || guestIds.length === 0) return [];
    const query = `
      UPDATE guests 
      SET family_id = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ANY($2::int[]) 
      RETURNING *
    `;
    const result = await pool.query(query, [familyId, guestIds]);
    return result.rows;
  },

  async removeMember(guestId) {
    const query = `
      UPDATE guests 
      SET family_id = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [guestId]);
    return result.rows[0];
  },

  async autoGenerateFamilies() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get all guests
      const guestsRes = await client.query(`
        SELECT id, name, type, partner_name, group_relation, family_id 
        FROM guests
      `);
      const guests = guestsRes.rows;

      // Group guests by their family name
      const familyGroups = new Map();

      for (const guest of guests) {
        let famName = null;
        const typeStr = (guest.type || '').trim();

        if (typeStr && !['individual', 'adulto', 'niño', 'nino', 'general'].includes(typeStr.toLowerCase())) {
          // Normalize typos like Fanilia / Famia
          famName = typeStr
            .replace(/^Fanilia/i, 'Familia')
            .replace(/^Famia/i, 'Familia')
            .trim();
        } else if (guest.partner_name && !['novio', 'novia', 'comun', 'general'].includes(guest.partner_name.trim().toLowerCase())) {
          famName = `Familia ${guest.name.split(' ')[0]} y ${guest.partner_name.split(' ')[0]}`;
        }

        if (famName) {
          if (!familyGroups.has(famName)) {
            familyGroups.set(famName, []);
          }
          familyGroups.get(famName).push(guest.id);
        }
      }

      let familiesCreated = 0;
      let guestsAssigned = 0;

      for (const [familyName, memberIds] of familyGroups.entries()) {
        // Check if family already exists
        let famId;
        const existingFamRes = await client.query(
          `SELECT id FROM families WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))`, 
          [familyName]
        );

        if (existingFamRes.rows.length > 0) {
          famId = existingFamRes.rows[0].id;
        } else {
          const insertFamRes = await client.query(
            `INSERT INTO families (name, notes) VALUES ($1, $2) RETURNING id`,
            [familyName, 'Generada automáticamente a partir de los invitados']
          );
          famId = insertFamRes.rows[0].id;
          familiesCreated++;
        }

        // Assign members to family
        const updateRes = await client.query(
          `UPDATE guests SET family_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2::int[]) AND (family_id IS NULL OR family_id != $1)`,
          [famId, memberIds]
        );
        guestsAssigned += updateRes.rowCount;
      }

      await client.query('COMMIT');

      return {
        familiesCreated,
        guestsAssigned,
        totalFamilies: familyGroups.size
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteFamily(id, deleteMembers = false) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (deleteMembers) {
        await client.query('DELETE FROM guests WHERE family_id = $1', [id]);
      } else {
        await client.query('UPDATE guests SET family_id = NULL WHERE family_id = $1', [id]);
      }
      const result = await client.query('DELETE FROM families WHERE id = $1 RETURNING *', [id]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};
