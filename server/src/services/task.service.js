import pool from '../config/database.js';

export const taskService = {
  async getAllTasks(filters = {}) {
    const { category, assigned_to, status, search } = filters;
    let query = `SELECT * FROM tasks WHERE 1=1`;
    const params = [];

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (assigned_to && assigned_to !== 'all') {
      params.push(assigned_to);
      query += ` AND assigned_to = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (
        LOWER(title) LIKE $${params.length} 
        OR LOWER(COALESCE(description, '')) LIKE $${params.length}
        OR subtasks::text ILIKE $${params.length}
      )`;
    }

    // Pendientes primero, luego por prioridad y fecha límite
    query += ` ORDER BY 
      CASE WHEN status = 'completed' THEN 2 ELSE 1 END ASC,
      CASE 
        WHEN priority = 'alta' THEN 1 
        WHEN priority = 'media' THEN 2 
        ELSE 3 
      END ASC,
      due_date ASC NULLS LAST,
      id ASC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getTaskById(id) {
    const result = await pool.query(`SELECT * FROM tasks WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async createTask(data) {
    const {
      title,
      description = '',
      category = 'General',
      assigned_to = 'Juntos',
      priority = 'media',
      status = 'pending',
      due_date = null,
      estimated_cost = 0,
      actual_cost = 0,
      subtasks = [],
    } = data;

    // Asegurar que subtasks tengan ID
    const sanitizedSubtasks = (Array.isArray(subtasks) ? subtasks : []).map((st, i) => ({
      id: st.id || `st-${Date.now()}-${i}`,
      title: st.title || '',
      completed: Boolean(st.completed),
    }));

    const query = `
      INSERT INTO tasks (
        title, description, category, assigned_to, priority, status, 
        due_date, estimated_cost, actual_cost, subtasks, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      title.trim(),
      description || '',
      category || 'General',
      assigned_to || 'Juntos',
      priority || 'media',
      status || 'pending',
      due_date || null,
      parseFloat(estimated_cost) || 0,
      parseFloat(actual_cost) || 0,
      JSON.stringify(sanitizedSubtasks),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async updateTask(id, data) {
    const current = await this.getTaskById(id);
    if (!current) throw new Error('Tarea no encontrada');

    const title = data.title !== undefined ? data.title.trim() : current.title;
    const description = data.description !== undefined ? data.description : current.description;
    const category = data.category !== undefined ? data.category : current.category;
    const assigned_to = data.assigned_to !== undefined ? data.assigned_to : current.assigned_to;
    const priority = data.priority !== undefined ? data.priority : current.priority;
    const status = data.status !== undefined ? data.status : current.status;
    const due_date = data.due_date !== undefined ? (data.due_date || null) : current.due_date;
    const estimated_cost = data.estimated_cost !== undefined ? parseFloat(data.estimated_cost) || 0 : current.estimated_cost;
    const actual_cost = data.actual_cost !== undefined ? parseFloat(data.actual_cost) || 0 : current.actual_cost;
    
    let subtasks = current.subtasks || [];
    if (data.subtasks !== undefined) {
      subtasks = (Array.isArray(data.subtasks) ? data.subtasks : []).map((st, i) => ({
        id: st.id || `st-${Date.now()}-${i}`,
        title: st.title || '',
        completed: Boolean(st.completed),
      }));
    }

    const query = `
      UPDATE tasks 
      SET 
        title = $1,
        description = $2,
        category = $3,
        assigned_to = $4,
        priority = $5,
        status = $6,
        due_date = $7,
        estimated_cost = $8,
        actual_cost = $9,
        subtasks = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      title,
      description,
      category,
      assigned_to,
      priority,
      status,
      due_date,
      estimated_cost,
      actual_cost,
      JSON.stringify(subtasks),
      id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteTask(id) {
    const result = await pool.query(`DELETE FROM tasks WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  },

  async toggleTaskStatus(id, newStatus = null) {
    const current = await this.getTaskById(id);
    if (!current) throw new Error('Tarea no encontrada');

    const nextStatus = newStatus || (current.status === 'completed' ? 'pending' : 'completed');
    
    // Si la tarea se marca como completada, opcionalmente completar todas sus subtareas
    let subtasks = current.subtasks || [];
    if (nextStatus === 'completed') {
      subtasks = subtasks.map(st => ({ ...st, completed: true }));
    }

    const result = await pool.query(
      `UPDATE tasks SET status = $1, subtasks = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [nextStatus, JSON.stringify(subtasks), id]
    );

    return result.rows[0];
  },

  async toggleSubtask(taskId, subtaskId) {
    const current = await this.getTaskById(taskId);
    if (!current) throw new Error('Tarea no encontrada');

    const subtasks = (current.subtasks || []).map(st => {
      if (st.id === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    // Si todas las subtareas están completadas, actualizar estado de la tarea
    const allCompleted = subtasks.length > 0 && subtasks.every(st => st.completed);
    let nextStatus = current.status;
    if (allCompleted) {
      nextStatus = 'completed';
    } else if (current.status === 'completed' && !allCompleted) {
      nextStatus = 'pending';
    }

    const result = await pool.query(
      `UPDATE tasks SET subtasks = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [JSON.stringify(subtasks), nextStatus, taskId]
    );

    return result.rows[0];
  },

  async getTaskStats() {
    const res = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status != 'completed') as pending,
        COALESCE(SUM(estimated_cost), 0) as total_estimated_cost,
        COALESCE(SUM(actual_cost), 0) as total_actual_cost
      FROM tasks
    `);

    const byAssigned = await pool.query(`
      SELECT 
        COALESCE(assigned_to, 'Juntos') as assigned_to,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status != 'completed') as pending
      FROM tasks
      GROUP BY assigned_to
    `);

    const byCategory = await pool.query(`
      SELECT 
        COALESCE(category, 'General') as category,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status != 'completed') as pending
      FROM tasks
      GROUP BY category
    `);

    const stats = res.rows[0] || {};
    const total = parseInt(stats.total, 10) || 0;
    const completed = parseInt(stats.completed, 10) || 0;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending: parseInt(stats.pending, 10) || 0,
      progressPercent,
      totalEstimatedCost: parseFloat(stats.total_estimated_cost) || 0,
      totalActualCost: parseFloat(stats.total_actual_cost) || 0,
      byAssigned: byAssigned.rows,
      byCategory: byCategory.rows,
    };
  },

  async loadPresetTasks() {
    const presets = [
      {
        title: 'Comprar y grabar anillos de boda',
        description: 'Buscar alianzas duraderas en oro o platino. Cotizar grabado de fecha y nombres.',
        category: 'Anillos & Joyería',
        assigned_to: 'Juntos',
        priority: 'alta',
        subtasks: [
          { id: 'an-1', title: 'Definir presupuesto para las alianzas', completed: false },
          { id: 'an-2', title: 'Visitar joyerías y seleccionar el modelo', completed: false },
          { id: 'an-3', title: 'Confirmar tallas de Enrique y Denia', completed: false },
          { id: 'an-4', title: 'Mandar a grabar fecha y nombres en el interior', completed: false },
        ]
      },
      {
        title: 'Vestido de Novia & Accesorios',
        description: 'Citas de prueba con modista/tienda. Zapatos cómodos para la recepción.',
        category: 'Vestuario & Belleza',
        assigned_to: 'Novia',
        priority: 'alta',
        subtasks: [
          { id: 'vn-1', title: 'Seleccionar y apartar el vestido de novia', completed: false },
          { id: 'vn-2', title: 'Elegir velo, zapatos y tiara / tocado', completed: false },
          { id: 'vn-3', title: 'Prueba de peinado y maquillaje profesional', completed: false },
          { id: 'vn-4', title: 'Último ajuste de talle y bastilla 2 semanas antes', completed: false },
        ]
      },
      {
        title: 'Traje del Novio & Complementos',
        description: 'Traje formal o smoking con camisa a la medida.',
        category: 'Vestuario & Belleza',
        assigned_to: 'Novio',
        priority: 'alta',
        subtasks: [
          { id: 'tn-1', title: 'Elegir corte y color del traje', completed: false },
          { id: 'tn-2', title: 'Zapatos de gala y cinturón a juego', completed: false },
          { id: 'tn-3', title: 'Corbata o corbatín y pañuelo', completed: false },
          { id: 'tn-4', title: 'Cita con el sastre para ajuste de mangas y pantalón', completed: false },
        ]
      },
      {
        title: 'Menú y Degustación del Banquete',
        description: 'Definir tiempos de la comida, opciones especiales y bebidas.',
        category: 'Recepción & Banquete',
        assigned_to: 'Juntos',
        priority: 'alta',
        subtasks: [
          { id: 'bq-1', title: 'Cita de degustación de los platillos principales', completed: false },
          { id: 'bq-2', title: 'Revisar restricciones alimentarias de invitados celíacos/vegetarianos', completed: false },
          { id: 'bq-3', title: 'Elegir diseño y sabor del pastel de bodas', completed: false },
          { id: 'bq-4', title: 'Definir barra de cócteles y vino para el brindis', completed: false },
        ]
      },
      {
        title: 'Fotografía y Video de la Boda',
        description: 'Fotógrafo profesional para documentar ceremonia y fiesta.',
        category: 'Fotografía & Video',
        assigned_to: 'Juntos',
        priority: 'alta',
        subtasks: [
          { id: 'fv-1', title: 'Revisar portafolios y firmar contrato de cobertura', completed: false },
          { id: 'fv-2', title: 'Armar lista de fotos familiares y grupos indispensables', completed: false },
          { id: 'fv-3', title: 'Coordinar horario de sesión previa / first look', completed: false },
        ]
      },
      {
        title: 'Música de Ceremonia y DJ para la Fiesta',
        description: 'Coordinar ambientación acústica y lista musical.',
        category: 'Música & Fiesta',
        assigned_to: 'Juntos',
        priority: 'media',
        subtasks: [
          { id: 'mu-1', title: 'Canción especial de entrada para la novia', completed: false },
          { id: 'mu-2', title: 'Seleccionar canción para el primer baile de esposos', completed: false },
          { id: 'mu-3', title: 'Entregar lista de canciones favoritas y lista de no reproducir', completed: false },
        ]
      },
      {
        title: 'Trámites Legales & Licencia Matrimonial',
        description: 'Papelería oficial para el matrimonio civil / eclesiástico.',
        category: 'Trámites & Legal',
        assigned_to: 'Juntos',
        priority: 'alta',
        subtasks: [
          { id: 'tr-1', title: 'Reunir actas de nacimiento actualizadas', completed: false },
          { id: 'tr-2', title: 'Realizar exámenes prenupciales requeridos', completed: false },
          { id: 'tr-3', title: 'Agendar fecha formal ante el juzgado o registro civil', completed: false },
        ]
      },
      {
        title: 'Rotulación y Entrega de Tarjetas de Invitación',
        description: 'Seguimiento con el módulo de tarjetas de la app BodaED.',
        category: 'Papelería & Recuerdos',
        assigned_to: 'Juntos',
        priority: 'alta',
        subtasks: [
          { id: 'pp-1', title: 'Generar y descargar el PDF de sobres desde BodaED', completed: false },
          { id: 'pp-2', title: 'Llevar lista al calígrafo o rotular sobres a mano', completed: false },
          { id: 'pp-3', title: 'Entregar invitaciones prioritarias a padrinos y familia lejana', completed: false },
          { id: 'pp-4', title: 'Completar entregas y dar seguimiento a confirmaciones', completed: false },
        ]
      }
    ];

    const created = [];
    for (const p of presets) {
      const task = await this.createTask(p);
      created.push(task);
    }
    return created;
  }
};
