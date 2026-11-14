import { Router } from 'express';
import * as migrationController from '../controllers/migrationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Migration endpoint to import existing browser localStorage data
router.post('/import-local', authMiddleware, migrationController.migrateLocalData);

export default router;
