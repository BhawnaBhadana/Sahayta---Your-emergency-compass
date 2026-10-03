import { Router } from 'express';
import {
  createResourceRequestHandler,
  listResourceRequestsHandler,
  updateResourceRequestHandler,
} from '../controllers/resourceController.js';
import { createResourceRequestSchema, updateResourceRequestSchema } from '../validators/resourceValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listResourceRequestsHandler);
router.post('/', requireAuth, requireRole('ngo', 'admin', 'coordinator', 'volunteer'), validateBody(createResourceRequestSchema), createResourceRequestHandler);
router.patch('/:id', requireAuth, requireRole('ngo', 'admin', 'coordinator'), validateBody(updateResourceRequestSchema), updateResourceRequestHandler);

export default router;
