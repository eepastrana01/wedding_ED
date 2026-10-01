import { photoService } from '../services/photo.service.js';

export const photoController = {
  async getAll(req, res, next) {
    try {
      const photos = await photoService.getAllPhotos(req.query);
      res.json({ success: true, data: photos });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const photo = await photoService.getPhotoById(req.params.id);
      if (!photo) {
        return res.status(404).json({ success: false, message: 'Foto no encontrada' });
      }
      res.json({ success: true, data: photo });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { url, uploader_name } = req.body;
      if (!url || !url.trim()) {
        return res.status(400).json({ success: false, message: 'La URL o imagen es obligatoria' });
      }
      if (!uploader_name || !uploader_name.trim()) {
        return res.status(400).json({ success: false, message: 'El nombre de quien comparte es obligatorio' });
      }

      const photo = await photoService.createPhoto(req.body);
      res.status(201).json({ success: true, data: photo, message: '¡Foto compartida con éxito!' });
    } catch (error) {
      next(error);
    }
  },

  async like(req, res, next) {
    try {
      const photo = await photoService.likePhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ success: false, message: 'Foto no encontrada' });
      }
      res.json({ success: true, data: photo, message: '¡Like registrado!' });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!['approved', 'pending', 'hidden'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado no válido' });
      }
      const updated = await photoService.updateStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Foto no encontrada' });
      }
      res.json({ success: true, data: updated, message: `Estado actualizado a ${status}` });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await photoService.deletePhoto(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Foto no encontrada' });
      }
      res.json({ success: true, data: deleted, message: 'Foto eliminada' });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await photoService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
};
