import { Router } from 'express';
import { listNotificationsHandler, markReadHandler, markAllReadHandler } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listNotificationsHandler);
router.patch('/:id/read', requireAuth, markReadHandler);
router.patch('/read-all', requireAuth, markAllReadHandler);

export default router;
