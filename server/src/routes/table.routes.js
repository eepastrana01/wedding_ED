import { Router } from 'express';
import { tableController } from '../controllers/table.controller.js';

const router = Router();

router.get('/', tableController.getAll);
router.post('/', tableController.create);
router.post('/auto-generate', tableController.autoGenerate);
router.post('/unassign', tableController.unassign);

router.get('/:id', tableController.getById);
router.put('/:id', tableController.update);
router.delete('/:id', tableController.delete);
router.post('/:id/assign', tableController.assign);
router.post('/:id/clear', tableController.clearTable);

export default router;
