import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { schemas } from '../validators/schemas.js';

const router = Router();

// Rate-limited login: max 15 attempts per 15 minutes
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many sign-in attempts. Please wait 15 minutes before trying again.',
});

router.post('/login', loginLimiter, validate(schemas.login), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/change-password', authMiddleware, validate(schemas.changePassword), authController.changePassword);

export default router;
