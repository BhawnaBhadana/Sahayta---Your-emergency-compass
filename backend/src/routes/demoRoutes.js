import { Router } from 'express';
import { launchScenarioHandler } from '../controllers/demoController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/launch-scenario', requireAuth, requireRole('admin', 'coordinator'), launchScenarioHandler);

export default router;
