import { Router } from 'express';
import {
  getMyFamilyHandler,
  addMemberHandler,
  updateMemberStatusHandler,
  removeMemberHandler,
} from '../controllers/familyController.js';
import { addFamilyMemberSchema, updateFamilyStatusSchema } from '../validators/familyValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getMyFamilyHandler);
router.post('/members', requireAuth, validateBody(addFamilyMemberSchema), addMemberHandler);
router.patch('/members/:memberId/status', requireAuth, validateBody(updateFamilyStatusSchema), updateMemberStatusHandler);
router.delete('/members/:memberId', requireAuth, removeMemberHandler);

export default router;
