import pool from '../config/database.js';

export const statsService = {
  async getDashboardStats() {
    const totalQuery = `
      SELECT 
        COUNT(*)::int as total_guests,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::int as confirmed_guests,
        COUNT(CASE WHEN status = 'declined' THEN 1 END)::int as declined_guests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending_guests,
        SUM(CASE WHEN status = 'confirmed' THEN confirmed_seats ELSE 0 END)::int as confirmed_total_seats
      FROM guests
    `;

    const familyStatsQuery = `
      SELECT 
        COUNT(*)::int as total_families
      FROM families
    `;

    const priorityQuery = `
      SELECT 
        COALESCE(priority, 'Sin Prioridad') as priority,
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::int as confirmed,
        COUNT(CASE WHEN status = 'declined' THEN 1 END)::int as declined,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending
      FROM guests
      GROUP BY priority
      ORDER BY priority ASC
    `;

    const groupRelationQuery = `
      SELECT 
        COALESCE(group_relation, 'General') as group_relation,
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::int as confirmed,
        COUNT(CASE WHEN status = 'declined' THEN 1 END)::int as declined,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending
      FROM guests
      GROUP BY group_relation
      ORDER BY total DESC
    `;

    const typeQuery = `
      SELECT 
        COALESCE(type, 'Adulto') as type,
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::int as confirmed
      FROM guests
      GROUP BY type
      ORDER BY total DESC
    `;

    const [totalRes, familyRes, priorityRes, groupRes, typeRes] = await Promise.all([
      pool.query(totalQuery),
      pool.query(familyStatsQuery),
      pool.query(priorityQuery),
      pool.query(groupRelationQuery),
      pool.query(typeQuery),
    ]);

    return {
      overview: {
        ...totalRes.rows[0],
        total_families: familyRes.rows[0]?.total_families || 0,
      },
      byPriority: priorityRes.rows,
      byGroupRelation: groupRes.rows,
      byType: typeRes.rows,
    };
  }
};
