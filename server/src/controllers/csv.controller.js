import { csvService } from '../services/csv.service.js';

export const csvController = {
  async importCsv(req, res, next) {
    try {
      const { rows, options = {} } = req.body;

      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se enviaron filas o datos para importar'
        });
      }

      const result = await csvService.importGuestsFromRows(rows, options);
      res.status(201).json({
        success: true,
        data: result,
        message: `Se importaron ${result.count} invitados correctamente${result.familiesCreated > 0 ? ` y se crearon ${result.familiesCreated} familias` : ''}.`
      });
    } catch (error) {
      next(error);
    }
  }
};
