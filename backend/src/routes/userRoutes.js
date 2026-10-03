import { Router } from 'express';
import { listUsersHandler, updateRoleHandler, setActiveHandler, verifyOrgHandler } from '../controllers/userController.js';
import { updateRoleSchema, setActiveSchema } from '../validators/userValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', listUsersHandler);
router.patch('/:id/role', validateBody(updateRoleSchema), updateRoleHandler);
router.patch('/:id/active', validateBody(setActiveSchema), setActiveHandler);
router.patch('/:id/verify-org', verifyOrgHandler);

export default router;
