import { Router } from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { schemas } from '../validators/schemas.js';

const router = Router();

// Public: get active doctors for inquiry form dropdown (or all for admin if requested)
router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);

// Protected: modifications require authentication
router.post('/', authMiddleware, validate(schemas.doctor), doctorController.createDoctor);
router.put('/:id', authMiddleware, validate(schemas.doctor), doctorController.updateDoctor);
router.delete('/:id', authMiddleware, doctorController.deleteDoctor);

export default router;
