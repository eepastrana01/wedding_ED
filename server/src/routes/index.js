import { Router } from 'express';
import guestRoutes from './guest.routes.js';
import familyRoutes from './family.routes.js';
import statsRoutes from './stats.routes.js';
import csvRoutes from './csv.routes.js';
import taskRoutes from './task.routes.js';

const router = Router();

router.use('/guests', guestRoutes);
router.use('/families', familyRoutes);
router.use('/stats', statsRoutes);
router.use('/csv', csvRoutes);
router.use('/tasks', taskRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
