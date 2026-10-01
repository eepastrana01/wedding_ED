import pool from '../config/database.js';

export const photoService = {
  // Obtener todas las fotos con filtros opcionales
  async getAllPhotos(filters = {}) {
    let query = `
      SELECT 
        p.*,
        g.name as guest_registered_name,
        f.name as family_registered_name
      FROM photos p
      LEFT JOIN guests g ON p.guest_id = g.id
      LEFT JOIN families f ON p.family_id = f.id
    `;
    const params = [];
    const conditions = [];

    // Por defecto mostramos las aprobadas a menos que se pida 'all' o 'pending'
    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      conditions.push(`p.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Ordenar por más recientes o por más likes
    if (filters.sort === 'popular') {
      query += ` ORDER BY p.likes DESC, p.created_at DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    if (filters.limit) {
      params.push(parseInt(filters.limit, 10));
      query += ` LIMIT $${params.length}`;
    }

    const { rows } = await pool.query(query, params);
    return rows;
  },

  // Obtener foto por ID
  async getPhotoById(id) {
    const query = `
      SELECT p.*, g.name as guest_registered_name, f.name as family_registered_name
      FROM photos p
      LEFT JOIN guests g ON p.guest_id = g.id
      LEFT JOIN families f ON p.family_id = f.id
      WHERE p.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  // Registrar nueva foto subida por invitado
  async createPhoto(data) {
    const {
      url,
      thumbnail_url,
      storage_key,
      uploader_name,
      caption,
      guest_id,
      family_id,
      status = 'approved',
    } = data;

    const query = `
      INSERT INTO photos (
        url,
        thumbnail_url,
        storage_key,
        uploader_name,
        caption,
        guest_id,
        family_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      url,
      thumbnail_url || url,
      storage_key || null,
      uploader_name.trim(),
      caption ? caption.trim() : null,
      guest_id || null,
      family_id || null,
      status,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Dar like a una foto
  async likePhoto(id) {
    const query = `
      UPDATE photos 
      SET likes = likes + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  // Actualizar estado de foto (moderación: approved, hidden, pending)
  async updateStatus(id, status) {
    const query = `
      UPDATE photos 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [status, id]);
    return rows[0] || null;
  },

  // Eliminar foto
  async deletePhoto(id) {
    const query = `DELETE FROM photos WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  // Estadísticas del álbum
  async getStats() {
    const countQuery = `
      SELECT 
        COUNT(*) as total_photos,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_photos,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_photos,
        COALESCE(SUM(likes), 0) as total_likes,
        COUNT(DISTINCT LOWER(TRIM(uploader_name))) as total_uploaders
      FROM photos
    `;
    const { rows } = await pool.query(countQuery);
    return rows[0];
  }
};
