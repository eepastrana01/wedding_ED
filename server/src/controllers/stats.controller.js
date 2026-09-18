import { statsService } from '../services/stats.service.js';

export const statsController = {
  async getStats(req, res, next) {
    try {
      const stats = await statsService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
};
