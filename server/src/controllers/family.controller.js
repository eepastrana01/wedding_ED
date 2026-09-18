import { familyService } from '../services/family.service.js';

export const familyController = {
  async getAll(req, res, next) {
    try {
      const families = await familyService.getAllFamilies(req.query.search);
      res.json({ success: true, data: families });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const family = await familyService.getFamilyById(req.params.id);
      if (!family) {
        return res.status(404).json({ success: false, message: 'Familia no encontrada' });
      }
      res.json({ success: true, data: family });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'El nombre de la familia es obligatorio' });
      }
      const newFamily = await familyService.createFamily(req.body);
      res.status(201).json({ success: true, data: newFamily, message: 'Familia creada con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await familyService.updateFamily(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Familia no encontrada' });
      }
      res.json({ success: true, data: updated, message: 'Familia actualizada' });
    } catch (error) {
      next(error);
    }
  },

  async updateBulkStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!['pending', 'confirmed', 'declined'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado no válido' });
      }
      const updatedMembers = await familyService.bulkUpdateFamilyStatus(req.params.id, status);
      res.json({
        success: true,
        data: updatedMembers,
        message: `Se actualizó la asistencia de ${updatedMembers.length} miembros a "${status}"`
      });
    } catch (error) {
      next(error);
    }
  },

  async updateDelivery(req, res, next) {
    try {
      const { delivered } = req.body;
      const updated = await familyService.updateDeliveryStatus(req.params.id, delivered);
      res.json({ success: true, data: updated, message: 'Estado de entrega de tarjeta familiar actualizado' });
    } catch (error) {
      next(error);
    }
  },

  async assignMembers(req, res, next) {
    try {
      const { guest_ids } = req.body;
      const updated = await familyService.assignMembers(req.params.id, guest_ids);
      res.json({ success: true, data: updated, message: 'Miembros asignados a la familia' });
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req, res, next) {
    try {
      const updated = await familyService.removeMember(req.params.guestId);
      res.json({ success: true, data: updated, message: 'Invitado desvinculado de la familia' });
    } catch (error) {
      next(error);
    }
  },

  async autoGenerate(req, res, next) {
    try {
      const result = await familyService.autoGenerateFamilies();
      res.json({
        success: true,
        data: result,
        message: `Se crearon ${result.familiesCreated} familias y se agruparon ${result.guestsAssigned} invitados.`
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const deleteMembers = req.query.delete_members === 'true';
      const deleted = await familyService.deleteFamily(req.params.id, deleteMembers);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Familia no encontrada' });
      }
      res.json({ success: true, data: deleted, message: 'Familia eliminada' });
    } catch (error) {
      next(error);
    }
  }
};
