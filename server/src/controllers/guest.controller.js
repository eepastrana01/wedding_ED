import { guestService } from '../services/guest.service.js';

export const guestController = {
  async getAll(req, res, next) {
    try {
      const guests = await guestService.getAllGuests(req.query);
      res.json({ success: true, data: guests });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const guest = await guestService.getGuestById(req.params.id);
      if (!guest) {
        return res.status(404).json({ success: false, message: 'Invitado no encontrado' });
      }
      res.json({ success: true, data: guest });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
      }
      const newGuest = await guestService.createGuest(req.body);
      res.status(201).json({ success: true, data: newGuest, message: 'Invitado creado con éxito' });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updatedGuest = await guestService.updateGuest(req.params.id, req.body);
      if (!updatedGuest) {
        return res.status(404).json({ success: false, message: 'Invitado no encontrado' });
      }
      res.json({ success: true, data: updatedGuest, message: 'Invitado actualizado' });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!['pending', 'confirmed', 'declined'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado no válido' });
      }
      const updated = await guestService.updateStatus(req.params.id, status);
      res.json({ success: true, data: updated, message: `Estado actualizado a ${status}` });
    } catch (error) {
      next(error);
    }
  },

  async updateDelivery(req, res, next) {
    try {
      const { delivered } = req.body;
      const updated = await guestService.updateDeliveryStatus(req.params.id, delivered);
      res.json({ success: true, data: updated, message: 'Estado de entrega de tarjeta actualizado' });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await guestService.deleteGuest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Invitado no encontrado' });
      }
      res.json({ success: true, data: deleted, message: 'Invitado eliminado' });
    } catch (error) {
      next(error);
    }
  },

  async deleteMultiple(req, res, next) {
    try {
      const { ids } = req.body;
      const deleted = await guestService.deleteMultipleGuests(ids);
      res.json({ success: true, data: deleted, message: `${deleted.length} invitados eliminados` });
    } catch (error) {
      next(error);
    }
  },

  async clearAll(req, res, next) {
    try {
      const count = await guestService.deleteAllGuests();
      res.json({ success: true, message: `Se han eliminado ${count} invitados.` });
    } catch (error) {
      next(error);
    }
  }
};
