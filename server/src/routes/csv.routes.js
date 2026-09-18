import { Router } from 'express';
import { csvController } from '../controllers/csv.controller.js';

const router = Router();

router.post('/import', csvController.importCsv);

export default router;
