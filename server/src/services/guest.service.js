import pool from '../config/database.js';

export const guestService = {
  async getAllGuests(filters = {}) {
    const { search, status, group_relation, priority, family_id } = filters;
    let query = `
      SELECT 
        g.*,
        f.name as family_name
      FROM guests g
      LEFT JOIN families f ON g.family_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (
        LOWER(g.name) LIKE $${params.length} 
        OR LOWER(COALESCE(g.partner_name, '')) LIKE $${params.length} 
        OR LOWER(COALESCE(f.name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(g.phone, '')) LIKE $${params.length}
      )`;
    }

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND g.status = $${params.length}`;
    }

    if (group_relation && group_relation !== 'all') {
      params.push(group_relation);
      query += ` AND g.group_relation = $${params.length}`;
    }

    if (priority && priority !== 'all') {
      params.push(priority);
      query += ` AND g.priority = $${params.length}`;
    }

    if (family_id) {
      if (family_id === 'none') {
        query += ` AND g.family_id IS NULL`;
      } else {
        params.push(parseInt(family_id, 10));
        query += ` AND g.family_id = $${params.length}`;
      }
    }

    query += ` ORDER BY COALESCE(f.name, g.name) ASC, g.id ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getGuestById(id) {
    const query = `
      SELECT g.*, f.name as family_name 
      FROM guests g
      LEFT JOIN families f ON g.family_id = f.id
      WHERE g.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async createGuest(data) {
    const {
      family_id,
      name,
      partner_name,
      type = 'Adulto',
      group_relation,
      guest_type = 'Titular',
      priority = 'A',
      status = 'pending',
      confirmed_seats = 1,
      dietary_notes,
      notes,
      phone,
      table_assigned
    } = data;

    const query = `
      INSERT INTO guests (
        family_id, name, partner_name, type, group_relation, 
        guest_type, priority, status, confirmed_seats, dietary_notes, 
        notes, phone, table_assigned, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      family_id || null,
      name,
      partner_name || null,
      type,
      group_relation || null,
      guest_type,
      priority,
      status,
      confirmed_seats,
      dietary_notes || null,
      notes || null,
      phone || null,
      table_assigned || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async updateGuest(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'family_id', 'name', 'partner_name', 'type', 'group_relation',
      'guest_type', 'priority', 'status', 'confirmed_seats',
      'dietary_notes', 'notes', 'phone', 'table_assigned', 'side'
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        if (key === 'family_id') {
          values.push(data[key] ? parseInt(data[key], 10) : null);
        } else if (key === 'confirmed_seats') {
          values.push(parseInt(data[key], 10) || 1);
        } else {
          values.push(data[key]);
        }
      }
    }

    if (fields.length === 0) {
      return this.getGuestById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE guests 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    await pool.query(query, values);
    return this.getGuestById(id);
  },

  async updateStatus(id, status) {
    const query = `
      UPDATE guests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  },

  async updateDeliveryStatus(id, delivered) {
    const query = `
      UPDATE guests 
      SET invitation_delivered = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [Boolean(delivered), id]);
    return result.rows[0];
  },

  async deleteGuest(id) {
    const query = `DELETE FROM guests WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async deleteMultipleGuests(ids) {
    if (!ids || ids.length === 0) return [];
    const query = `DELETE FROM guests WHERE id = ANY($1::int[]) RETURNING *`;
    const result = await pool.query(query, [ids]);
    return result.rows;
  },

  async deleteAllGuests() {
    const result = await pool.query(`DELETE FROM guests RETURNING id`);
    return result.rowCount;
  }
};
