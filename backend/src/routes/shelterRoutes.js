import { Router } from 'express';
import {
  createShelterHandler,
  listSheltersHandler,
  recommendSheltersHandler,
  getShelterHandler,
  updateOccupancyHandler,
} from '../controllers/shelterController.js';
import { createShelterSchema, updateOccupancySchema } from '../validators/shelterValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listSheltersHandler);
router.get('/recommend', optionalAuth, recommendSheltersHandler);
router.get('/:id', optionalAuth, getShelterHandler);
router.post('/', requireAuth, requireRole('ngo', 'admin', 'coordinator'), validateBody(createShelterSchema), createShelterHandler);
router.patch('/:id/occupancy', requireAuth, requireRole('ngo', 'admin', 'coordinator'), validateBody(updateOccupancySchema), updateOccupancyHandler);

export default router;
