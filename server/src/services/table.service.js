import pool from '../config/database.js';

export const tableService = {
  // Obtener todas las mesas con sus invitados asignados
  async getAllTables() {
    const query = `
      SELECT 
        t.id,
        t.table_number,
        t.name,
        t.capacity,
        t.shape,
        t.notes,
        COALESCE(t.pos_x, 0) as pos_x,
        COALESCE(t.pos_y, 0) as pos_y,
        COALESCE(t.rotation, 0) as rotation,
        t.created_at,
        t.updated_at,
        COUNT(g.id)::int as seated_count,
        COALESCE(SUM(COALESCE(g.confirmed_seats, 1)), 0)::int as total_seats_used,
        COALESCE(
          json_agg(
            json_build_object(
              'id', g.id,
              'name', g.name,
              'partner_name', g.partner_name,
              'family_id', g.family_id,
              'family_name', f.name,
              'status', g.status,
              'type', g.type,
              'group_relation', g.group_relation,
              'priority', g.priority,
              'confirmed_seats', COALESCE(g.confirmed_seats, 1),
              'dietary_notes', g.dietary_notes,
              'notes', g.notes,
              'phone', g.phone
            ) ORDER BY g.family_id ASC NULLS LAST, g.name ASC
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'::json
        ) as guests
      FROM wedding_tables t
      LEFT JOIN guests g ON g.table_id = t.id
      LEFT JOIN families f ON g.family_id = f.id
      GROUP BY t.id
      ORDER BY t.table_number ASC, t.id ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async getTableById(id) {
    const query = `
      SELECT 
        t.*,
        COUNT(g.id)::int as seated_count,
        COALESCE(SUM(COALESCE(g.confirmed_seats, 1)), 0)::int as total_seats_used,
        COALESCE(
          json_agg(
            json_build_object(
              'id', g.id,
              'name', g.name,
              'partner_name', g.partner_name,
              'family_id', g.family_id,
              'family_name', f.name,
              'status', g.status,
              'type', g.type,
              'group_relation', g.group_relation,
              'confirmed_seats', COALESCE(g.confirmed_seats, 1),
              'dietary_notes', g.dietary_notes
            ) ORDER BY g.name ASC
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'::json
        ) as guests
      FROM wedding_tables t
      LEFT JOIN guests g ON g.table_id = t.id
      LEFT JOIN families f ON g.family_id = f.id
      WHERE t.id = $1
      GROUP BY t.id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async createTable(data) {
    let { table_number, name, capacity, shape, notes, pos_x, pos_y, rotation } = data;

    // Si no se especifica número de mesa, calcular el siguiente
    if (!table_number) {
      const maxRes = await pool.query('SELECT COALESCE(MAX(table_number), 0) + 1 as next_num FROM wedding_tables');
      table_number = maxRes.rows[0].next_num;
    }

    const query = `
      INSERT INTO wedding_tables (table_number, name, capacity, shape, notes, pos_x, pos_y, rotation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      parseInt(table_number, 10),
      name ? name.trim() : null,
      parseInt(capacity, 10) || 10,
      shape || 'round',
      notes ? notes.trim() : null,
      parseInt(pos_x, 10) || 0,
      parseInt(pos_y, 10) || 0,
      parseInt(rotation, 10) || 0
    ]);
    return rows[0];
  },

  async updateTable(id, data) {
    const current = await this.getTableById(id);
    if (!current) throw new Error('Mesa no encontrada');

    const table_number = data.table_number !== undefined ? parseInt(data.table_number, 10) : current.table_number;
    const name = data.name !== undefined ? (data.name ? data.name.trim() : null) : current.name;
    const capacity = data.capacity !== undefined ? parseInt(data.capacity, 10) : current.capacity;
    const shape = data.shape !== undefined ? data.shape : current.shape;
    const notes = data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : current.notes;
    const pos_x = data.pos_x !== undefined ? parseInt(data.pos_x, 10) : current.pos_x;
    const pos_y = data.pos_y !== undefined ? parseInt(data.pos_y, 10) : current.pos_y;
    const rotation = data.rotation !== undefined ? parseInt(data.rotation, 10) : current.rotation;

    const query = `
      UPDATE wedding_tables
      SET 
        table_number = $1,
        name = $2,
        capacity = $3,
        shape = $4,
        notes = $5,
        pos_x = $6,
        pos_y = $7,
        rotation = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;
    const { rows } = await pool.query(query, [table_number, name, capacity, shape, notes, pos_x, pos_y, rotation, id]);

    // Mantener table_assigned en guests sincronizado con el nombre de la mesa
    if (rows[0]) {
      const tableLabel = rows[0].name ? `Mesa ${rows[0].table_number}: ${rows[0].name}` : `Mesa ${rows[0].table_number}`;
      await pool.query('UPDATE guests SET table_assigned = $1 WHERE table_id = $2', [tableLabel, id]);
    }

    return rows[0];
  },

  async deleteTable(id) {
    // 1. Desasignar a todos los invitados sentados en esta mesa
    await pool.query('UPDATE guests SET table_id = NULL, table_assigned = NULL WHERE table_id = $1', [id]);
    // 2. Eliminar la mesa
    const query = 'DELETE FROM wedding_tables WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  // Asignar uno o más invitados a una mesa específica
  async assignGuestsToTable(tableId, guestIds = []) {
    if (!guestIds || guestIds.length === 0) return [];

    const table = await this.getTableById(tableId);
    if (!table) throw new Error('Mesa no encontrada');

    const tableLabel = table.name ? `Mesa ${table.table_number}: ${table.name}` : `Mesa ${table.table_number}`;

    const query = `
      UPDATE guests
      SET 
        table_id = $1,
        table_assigned = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($3::int[])
      RETURNING *
    `;
    const { rows } = await pool.query(query, [tableId, tableLabel, guestIds]);
    return rows;
  },

  // Desasignar (quitar de mesa) uno o más invitados
  async unassignGuests(guestIds = []) {
    if (!guestIds || guestIds.length === 0) return [];

    const query = `
      UPDATE guests
      SET 
        table_id = NULL,
        table_assigned = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1::int[])
      RETURNING *
    `;
    const { rows } = await pool.query(query, [guestIds]);
    return rows;
  },

  // Desasignar a todos los invitados de una mesa (limpiar mesa)
  async clearTable(tableId) {
    const query = `
      UPDATE guests
      SET 
        table_id = NULL,
        table_assigned = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE table_id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [tableId]);
    return rows;
  },

  // Auto-generar N mesas iniciales
  async autoGenerateTables(count = 10, defaultCapacity = 10) {
    const existing = await pool.query('SELECT table_number FROM wedding_tables');
    const existingNumbers = new Set(existing.rows.map(r => r.table_number));

    const created = [];
    let num = 1;
    while (created.length < count) {
      if (!existingNumbers.has(num)) {
        const res = await pool.query(
          'INSERT INTO wedding_tables (table_number, capacity, shape) VALUES ($1, $2, $3) RETURNING *',
          [num, defaultCapacity, 'round']
        );
        created.push(res.rows[0]);
        existingNumbers.add(num);
      }
      num++;
    }
    return created;
  }
};
