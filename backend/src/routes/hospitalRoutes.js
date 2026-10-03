import { Router } from 'express';
import {
  createHospitalHandler,
  listHospitalsHandler,
  getHospitalHandler,
  updateCapacityHandler,
} from '../controllers/hospitalController.js';
import { createHospitalSchema, updateCapacitySchema } from '../validators/hospitalValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listHospitalsHandler);
router.get('/:id', optionalAuth, getHospitalHandler);
router.post('/', requireAuth, requireRole('hospital', 'admin'), validateBody(createHospitalSchema), createHospitalHandler);
router.patch('/:id/capacity', requireAuth, requireRole('hospital', 'admin'), validateBody(updateCapacitySchema), updateCapacityHandler);

export default router;
