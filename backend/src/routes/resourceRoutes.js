import { Router } from 'express';
import {
  createResourceHandler,
  listResourcesHandler,
  updateResourceHandler,
  findMatchesHandler,
} from '../controllers/resourceController.js';
import { createResourceSchema, updateResourceSchema } from '../validators/resourceValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listResourcesHandler);
router.get('/match', requireAuth, findMatchesHandler);
router.post('/', requireAuth, requireRole('ngo', 'admin', 'coordinator'), validateBody(createResourceSchema), createResourceHandler);
router.patch('/:id', requireAuth, requireRole('ngo', 'admin', 'coordinator'), validateBody(updateResourceSchema), updateResourceHandler);

export default router;
