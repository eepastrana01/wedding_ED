import { Router } from 'express';
import { familyController } from '../controllers/family.controller.js';

const router = Router();

router.get('/', familyController.getAll);
router.post('/auto-generate', familyController.autoGenerate);
router.get('/:id', familyController.getById);
router.post('/', familyController.create);
router.put('/:id', familyController.update);
router.patch('/:id/status', familyController.updateBulkStatus);
router.patch('/:id/delivery', familyController.updateDelivery);
router.post('/:id/members', familyController.assignMembers);
router.delete('/:id/members/:guestId', familyController.removeMember);
router.delete('/:id', familyController.delete);

export default router;
