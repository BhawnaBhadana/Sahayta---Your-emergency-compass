import { Router } from 'express';
import {
  commandCenterHandler,
  responseTimesHandler,
  incidentBreakdownHandler,
  auditLogsHandler,
  incidentsOverTimeHandler,
  ratesHandler,
  teamUtilizationHandler,
  hotspotsHandler,
} from '../controllers/analyticsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const OPS_ROLES = ['admin', 'coordinator', 'responder'];

router.get('/command-center', requireAuth, requireRole(...OPS_ROLES), commandCenterHandler);
router.get('/response-times', requireAuth, requireRole(...OPS_ROLES), responseTimesHandler);
router.get('/incident-breakdown', requireAuth, requireRole(...OPS_ROLES), incidentBreakdownHandler);
router.get('/incidents-over-time', requireAuth, requireRole(...OPS_ROLES), incidentsOverTimeHandler);
router.get('/rates', requireAuth, requireRole(...OPS_ROLES), ratesHandler);
router.get('/team-utilization', requireAuth, requireRole(...OPS_ROLES), teamUtilizationHandler);
router.get('/hotspots', requireAuth, requireRole(...OPS_ROLES), hotspotsHandler);
router.get('/audit-logs', requireAuth, requireRole('admin', 'coordinator'), auditLogsHandler);

export default router;
