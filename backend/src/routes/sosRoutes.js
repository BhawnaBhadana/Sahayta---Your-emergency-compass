import { Router } from 'express';
import {
  createSosHandler,
  listSosHandler,
  getSosHandler,
  assignResponderHandler,
  updateStatusHandler,
  confirmTriageHandler,
} from '../controllers/sosController.js';
import { createSosSchema, updateSosStatusSchema, assignResponderSchema, confirmTriageSchema } from '../validators/sosValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';
import { sosLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', sosLimiter, optionalAuth, validateBody(createSosSchema), createSosHandler);
router.get('/', requireAuth, listSosHandler);
router.get('/:id', requireAuth, getSosHandler);
router.patch('/:id/assign', requireAuth, requireRole('responder', 'admin', 'coordinator'), validateBody(assignResponderSchema), assignResponderHandler);
router.patch('/:id/status', requireAuth, requireRole('responder', 'admin', 'coordinator'), validateBody(updateSosStatusSchema), updateStatusHandler);
router.patch('/:id/triage/confirm', requireAuth, requireRole('responder', 'admin', 'coordinator'), validateBody(confirmTriageSchema), confirmTriageHandler);

export default router;
