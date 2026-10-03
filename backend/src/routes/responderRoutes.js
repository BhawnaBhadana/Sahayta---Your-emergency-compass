import { Router } from 'express';
import {
  listRespondersHandler,
  listVolunteersHandler,
  recommendHandler,
  updateMyResponderProfileHandler,
  updateMyVolunteerProfileHandler,
} from '../controllers/responderController.js';
import { updateResponderProfileSchema, updateVolunteerProfileSchema } from '../validators/responderValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listRespondersHandler);
router.get('/volunteers', requireAuth, listVolunteersHandler);
router.get('/recommend', requireAuth, requireRole('responder', 'admin', 'coordinator'), recommendHandler);
router.patch('/me', requireAuth, requireRole('responder'), validateBody(updateResponderProfileSchema), updateMyResponderProfileHandler);
router.patch('/volunteers/me', requireAuth, requireRole('volunteer'), validateBody(updateVolunteerProfileSchema), updateMyVolunteerProfileHandler);

export default router;
