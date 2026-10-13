import { tableService } from '../services/table.service.js';

export const tableController = {
  async getAll(req, res, next) {
    try {
      const tables = await tableService.getAllTables();
      res.json({ success: true, data: tables });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const table = await tableService.getTableById(req.params.id);
      if (!table) {
        return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
      }
      res.json({ success: true, data: table });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const newTable = await tableService.createTable(req.body);
      res.status(201).json({ success: true, data: newTable, message: 'Mesa creada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await tableService.updateTable(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
      }
      res.json({ success: true, data: updated, message: 'Mesa actualizada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await tableService.deleteTable(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
      }
      res.json({ success: true, message: 'Mesa eliminada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async assign(req, res, next) {
    try {
      const { guest_ids } = req.body;
      if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un invitado' });
      }
      const updatedGuests = await tableService.assignGuestsToTable(req.params.id, guest_ids);
      res.json({ success: true, data: updatedGuests, message: 'Invitados asignados a la mesa' });
    } catch (error) {
      next(error);
    }
  },

  async unassign(req, res, next) {
    try {
      const { guest_ids } = req.body;
      if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un invitado' });
      }
      const updatedGuests = await tableService.unassignGuests(guest_ids);
      res.json({ success: true, data: updatedGuests, message: 'Invitados desasignados de la mesa' });
    } catch (error) {
      next(error);
    }
  },

  async clearTable(req, res, next) {
    try {
      await tableService.clearTable(req.params.id);
      res.json({ success: true, message: 'Mesa vaciada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async autoGenerate(req, res, next) {
    try {
      const count = parseInt(req.body.count, 10) || 10;
      const capacity = parseInt(req.body.capacity, 10) || 10;
      const created = await tableService.autoGenerateTables(count, capacity);
      res.json({ success: true, data: created, message: `${created.length} mesas generadas con éxito` });
    } catch (error) {
      next(error);
    }
  }
};
