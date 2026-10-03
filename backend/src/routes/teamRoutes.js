import { Router } from 'express';
import {
  createTeamHandler,
  listTeamsHandler,
  recommendTeamsHandler,
  updateTeamHandler,
  assignTeamHandler,
  updateAssignmentHandler,
  listAssignmentsHandler,
} from '../controllers/teamController.js';
import { createTeamSchema, updateTeamSchema, assignTeamSchema, updateAssignmentSchema } from '../validators/teamValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const OPS_ROLES = ['coordinator', 'admin'];

router.get('/', requireAuth, listTeamsHandler);
router.get('/recommend', requireAuth, requireRole(...OPS_ROLES, 'responder'), recommendTeamsHandler);
router.get('/assignments', requireAuth, listAssignmentsHandler);
router.post('/', requireAuth, requireRole(...OPS_ROLES), validateBody(createTeamSchema), createTeamHandler);
router.patch('/:id', requireAuth, requireRole(...OPS_ROLES), validateBody(updateTeamSchema), updateTeamHandler);
router.post('/:id/assign', requireAuth, requireRole(...OPS_ROLES), validateBody(assignTeamSchema), assignTeamHandler);
router.patch('/assignments/:assignmentId', requireAuth, requireRole(...OPS_ROLES, 'responder'), validateBody(updateAssignmentSchema), updateAssignmentHandler);

export default router;
