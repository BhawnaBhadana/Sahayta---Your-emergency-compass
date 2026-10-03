import { Router } from 'express';
import { computeRouteHandler, listBlockedRoadsHandler, reportBlockedRoadHandler } from '../controllers/routeController.js';
import { routeQuerySchema } from '../validators/responderValidators.js';
import { reportBlockedRoadSchema } from '../validators/roadValidators.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/safe-route', validateQuery(routeQuerySchema), computeRouteHandler);
router.get('/blocked-roads', listBlockedRoadsHandler);
router.post('/blocked-roads', optionalAuth, validateBody(reportBlockedRoadSchema), reportBlockedRoadHandler);

export default router;
