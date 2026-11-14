import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { schemas } from '../validators/schemas.js';

const router = Router();

// Settings view (lab info & WhatsApp destination) can be read by app for WhatsApp sharing
router.get('/', settingsController.getSettings);

// Settings modifications require authentication
router.put('/', authMiddleware, validate(schemas.settings), settingsController.updateSettings);

export default router;
