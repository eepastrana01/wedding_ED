import { Router } from 'express';
import { photoController } from '../controllers/photo.controller.js';

const router = Router();

router.get('/', photoController.getAll);
router.get('/stats', photoController.getStats);
router.get('/:id', photoController.getById);
router.post('/', photoController.create);
router.post('/:id/like', photoController.like);
router.patch('/:id/status', photoController.updateStatus);
router.delete('/:id', photoController.delete);

export default router;
