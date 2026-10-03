import { Router } from 'express';
import { registerHandler, loginHandler, meHandler } from '../controllers/authController.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), registerHandler);
router.post('/login', authLimiter, validateBody(loginSchema), loginHandler);
router.get('/me', requireAuth, meHandler);

export default router;
