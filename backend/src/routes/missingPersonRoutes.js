import { Router } from 'express';
import { createHandler, listHandler, updateStatusHandler } from '../controllers/missingPersonController.js';
import { createMissingPersonSchema, updateMissingPersonStatusSchema } from '../validators/missingPersonValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listHandler);
router.post('/', optionalAuth, validateBody(createMissingPersonSchema), createHandler);
router.patch('/:id/status', requireAuth, requireRole('responder', 'admin', 'coordinator'), validateBody(updateMissingPersonStatusSchema), updateStatusHandler);

export default router;
