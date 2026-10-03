import { Router } from 'express';
import {
  createTaskHandler,
  listTasksHandler,
  acceptTaskHandler,
  updateTaskStatusHandler,
} from '../controllers/taskController.js';
import { createTaskSchema, updateTaskStatusSchema } from '../validators/taskValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listTasksHandler);
router.post('/', requireAuth, requireRole('ngo', 'admin', 'coordinator', 'responder'), validateBody(createTaskSchema), createTaskHandler);
router.patch('/:id/accept', requireAuth, requireRole('volunteer'), acceptTaskHandler);
router.patch('/:id/status', requireAuth, requireRole('volunteer', 'admin', 'coordinator'), validateBody(updateTaskStatusSchema), updateTaskStatusHandler);

export default router;
