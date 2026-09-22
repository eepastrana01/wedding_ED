import { taskService } from '../services/task.service.js';

export const taskController = {
  async getAll(req, res, next) {
    try {
      const tasks = await taskService.getAllTasks(req.query);
      res.json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await taskService.getTaskStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
      }
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      if (!req.body.title || !req.body.title.trim()) {
        return res.status(400).json({ success: false, message: 'El título de la tarea es obligatorio' });
      }
      const newTask = await taskService.createTask(req.body);
      res.status(201).json({ success: true, data: newTask, message: 'Tarea creada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await taskService.updateTask(req.params.id, req.body);
      res.json({ success: true, data: updated, message: 'Tarea actualizada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await taskService.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
      }
      res.json({ success: true, message: 'Tarea eliminada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async toggleStatus(req, res, next) {
    try {
      const updated = await taskService.toggleTaskStatus(req.params.id, req.body.status);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async toggleSubtask(req, res, next) {
    try {
      const { id, subtaskId } = req.params;
      const updated = await taskService.toggleSubtask(id, subtaskId);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async loadPresets(req, res, next) {
    try {
      const created = await taskService.loadPresetTasks();
      res.json({ success: true, data: created, message: `${created.length} tareas esenciales cargadas con éxito` });
    } catch (error) {
      next(error);
    }
  },
};
