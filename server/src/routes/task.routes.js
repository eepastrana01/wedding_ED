import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';

const router = Router();

router.get('/', taskController.getAll);
router.get('/stats', taskController.getStats);
router.get('/budget/cash-on-hand', taskController.getCashOnHand);
router.put('/budget/cash-on-hand', taskController.updateCashOnHand);
router.post('/presets', taskController.loadPresets);
router.get('/:id', taskController.getById);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.delete);
router.patch('/:id/toggle', taskController.toggleStatus);
router.patch('/:id/subtasks/:subtaskId/toggle', taskController.toggleSubtask);

export default router;
