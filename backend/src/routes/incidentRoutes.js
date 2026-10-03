import { Router } from 'express';
import {
  createIncidentHandler,
  listIncidentsHandler,
  getIncidentHandler,
  reviewIncidentHandler,
} from '../controllers/incidentController.js';
import { createIncidentSchema, verifyIncidentSchema } from '../validators/incidentValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuth, validateBody(createIncidentSchema), createIncidentHandler);
router.get('/', requireAuth, listIncidentsHandler);
router.get('/:id', requireAuth, getIncidentHandler);
router.patch('/:id/review', requireAuth, requireRole('responder', 'admin', 'coordinator'), validateBody(verifyIncidentSchema), reviewIncidentHandler);

export default router;
