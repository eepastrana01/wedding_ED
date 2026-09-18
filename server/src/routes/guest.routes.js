import { Router } from 'express';
import { guestController } from '../controllers/guest.controller.js';

const router = Router();

router.get('/', guestController.getAll);
router.get('/:id', guestController.getById);
router.post('/', guestController.create);
router.put('/:id', guestController.update);
router.patch('/:id/status', guestController.updateStatus);
router.patch('/:id/delivery', guestController.updateDelivery);
router.delete('/batch', guestController.deleteMultiple);
router.delete('/clear-all', guestController.clearAll);
router.delete('/:id', guestController.delete);

export default router;
