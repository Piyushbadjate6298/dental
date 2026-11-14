import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/stats', authMiddleware, dashboardController.getDashboardStats);

export default router;
