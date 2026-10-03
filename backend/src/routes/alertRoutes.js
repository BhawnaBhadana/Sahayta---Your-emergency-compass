import { Router } from 'express';
import {
  createAlertHandler,
  listAlertsHandler,
  expireAlertHandler,
  acknowledgeAlertHandler,
  escalateAlertHandler,
  resolveAlertHandler,
} from '../controllers/alertController.js';
import { createAlertSchema } from '../validators/alertValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const OPS_ROLES = ['admin', 'coordinator'];

router.get('/', optionalAuth, listAlertsHandler);
router.post('/', requireAuth, requireRole(...OPS_ROLES), validateBody(createAlertSchema), createAlertHandler);
router.patch('/:id/expire', requireAuth, requireRole(...OPS_ROLES), expireAlertHandler);
router.patch('/:id/acknowledge', requireAuth, requireRole(...OPS_ROLES, 'responder'), acknowledgeAlertHandler);
router.patch('/:id/escalate', requireAuth, requireRole(...OPS_ROLES, 'responder'), escalateAlertHandler);
router.patch('/:id/resolve', requireAuth, requireRole(...OPS_ROLES), resolveAlertHandler);

export default router;
